'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function Chat() {
  const [modelId, setModelId] = useState('gemini');
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { modelId },
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch bg-white text-black min-h-screen">
      <div className="fixed top-0 w-full max-w-md p-4 bg-white border-b z-10 flex justify-between items-center">
        <h1 className="font-bold text-xl">CTO Agent</h1>
        <select 
          value={modelId} 
          onChange={(e) => setModelId(e.target.value)}
          className="p-1 border rounded text-sm bg-gray-50"
        >
          <option value="gemini">Gemini 1.5 (Free)</option>
          <option value="kimi">Kimi 2.5 (Moonshot)</option>
          <option value="mistral">Mistral Large</option>
          <option value="deepseek">DeepSeek</option>
          <option value="claude">Claude 3.5</option>
          <option value="gpt4">GPT-4o</option>
        </select>
      </div>

      <div className="space-y-4 pt-10">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Select a model and start chatting with your CTO Engineer.
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`p-4 rounded-lg ${m.role === 'user' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
            <span className="font-bold block mb-1 text-xs uppercase text-gray-500">
              {m.role === 'user' ? 'You' : 'Agent'}
            </span>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-4 mb-8 border border-gray-300 rounded-xl shadow-2xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={input}
          placeholder="Ask the CTO Engineer..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
