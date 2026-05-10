import { google } from '@ai-sdk/google';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// Kimi (Moonshot) is OpenAI-compatible
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

## Boundaries
- Keep private data private.
- Ask before external side effects or destructive actions.
`;

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();

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
      search: tool({
        description: 'Search the web for information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          // This uses a simple search API or the Tavily/Serper integration if keys provided
          // For now, we point to a generic search fetch
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
    },
  });

  return result.toDataStreamResponse();
}
