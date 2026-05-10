import { google } from '@ai-sdk/google';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';
import { streamText, tool, embed } from 'ai';
import { z } from 'zod';
import { ComposioToolSet } from "composio-core";
import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

const kimi = createOpenAI({
  baseURL: 'https://api.moonshot.cn/v1',
  apiKey: process.env.KIMI_API_KEY,
});

const systemPrompt = `
# Who You Are
You are a pragmatic, hands-on software assistant (The CTO Engineer).

## Core Rules
- Execute directly when action is requested; do not over-narrate.
- Keep responses concise and concrete.
- Be resourceful before asking clarifying questions.
- Never fabricate results.

## Capabilities
- You have access to web search and browsing tools.
- You can browse the internet to find current information.
- You have "Hands" via Composio to interact with external tools (Slack, GitHub, Gmail, Discord, Notion).
- You have Long-term Memory via a Supabase Vector Store. You can save and retrieve information.

## Boundaries
- Keep private data private.
- Ask before external side effects or destructive actions.
`;

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();

  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY,
  });

  // Pick the most important tools
  const composioTools = await toolset.getActions({ 
    actions: [
      'github_issues_create', 
      'slack_chat_post_message', 
      'gmail_send_email', 
      'discord_send_message', 
      'notion_pages_create',
      'google_calendar_create_event'
    ] 
  });

  let model;
  switch (modelId) {
    case 'gemini':
      model = google('gemini-1.5-flash');
      break;
    case 'gpt4':
      model = openai('gpt-4o');
      break;
    case 'claude':
      model = anthropic('claude-3-5-sonnet-20240620');
      break;
    case 'deepseek':
      model = deepseek('deepseek-chat');
      break;
    case 'mistral':
      model = mistral('mistral-large-latest');
      break;
    case 'kimi':
      model = kimi('moonshot-v1-8k');
      break;
    default:
      model = google('gemini-1.5-flash');
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: {
      ...composioTools,
      search: tool({
        description: 'Search the web for information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          const res = await fetch(`https://api.tavily.com/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, api_key: process.env.TAVILY_API_KEY })
          });
          return res.json();
        },
      }),
      browse: tool({
        description: 'Browse a specific URL to get its content',
        parameters: z.object({
          url: z.string().describe('The URL to browse'),
        }),
        execute: async ({ url }) => {
          const res = await fetch(`https://r.jina.ai/${url}`);
          const content = await res.text();
          return { content };
        },
      }),
      remember: tool({
        description: 'Save information to long-term memory (vector store)',
        parameters: z.object({
          text: z.string().describe('The information to remember'),
        }),
        execute: async ({ text }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: text,
          });

          const { error } = await supabase.from('documents').insert({
            content: text,
            embedding,
          });

          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      recall: tool({
        description: 'Search long-term memory for relevant information',
        parameters: z.object({
          query: z.string().describe('The search query for memory'),
        }),
        execute: async ({ query }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });

          const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
          });

          if (error) return { error: error.message };
          return { matches: data };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
