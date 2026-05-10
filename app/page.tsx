'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Chat() {
  const [modelId, setModelId] = useState('gemini');
  const [view, setView] = useState('chat'); // 'chat' or 'dashboard'
  const [statuses, setStatuses] = useState([
    { name: 'Gemini 1.5', status: 'Online', health: 'Healthy' },
    { name: 'Claude 3.5', status: 'Online', health: 'Healthy' },
    { name: 'GPT-4o', status: 'Online', health: 'Healthy' },
    { name: 'DeepSeek', status: 'Online', health: 'Healthy' },
    { name: 'Mistral', status: 'Online', health: 'Healthy' },
    { name: 'Kimi 2.5', status: 'Online', health: 'Healthy' },
  ]);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { modelId },
    onFinish: async (message) => {
      // Save to Supabase
      await supabase.from('messages').insert([
        { role: 'assistant', content: message.content, model_id: modelId }
      ]);
    }
  });

  const onUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Save user message to Supabase
    await supabase.from('messages').insert([
      { role: 'user', content: input, model_id: modelId }
    ]);
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      {/* Header / Navigation */}
      <div className="fixed top-0 w-full max-w-4xl p-4 bg-gray-800 border-b border-gray-700 z-10 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-4">
          <h1 className="font-bold text-xl text-blue-400 tracking-tighter uppercase italic">All-In-One AI</h1>
          <nav className="flex space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
            <button 
              onClick={() => setView('chat')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${view === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Dashboard
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-400 uppercase">Engine:</label>
          <select 
            value={modelId} 
            onChange={(e) => setModelId(e.target.value)}
            className="p-2 border border-gray-600 rounded bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="gemini">Gemini 1.5</option>
            <option value="kimi">Kimi 2.5</option>
            <option value="mistral">Mistral Large</option>
            <option value="deepseek">DeepSeek</option>
            <option value="claude">Claude 3.5</option>
            <option value="gpt4">GPT-4o</option>
          </select>
        </div>
      </div>

      {view === 'chat' ? (
        <div className="flex-1 flex flex-col pt-20 pb-32 px-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-50">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl font-bold">AI</span>
              </div>
              <p className="text-lg">Welcome, Chief. Your All-In-One AI is ready.</p>
              <p className="text-sm text-gray-500">I can browse the web and remember our chats.</p>
            </div>
          )}
          <div className="space-y-6">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-none'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1 block">
                    {m.role === 'user' ? 'Master' : modelId}
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={onUserSubmit} className="fixed bottom-0 w-full max-w-4xl p-4 bg-gray-900 border-t border-gray-800">
            <div className="relative group">
              <input
                className="w-full p-4 pr-16 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xl"
                value={input}
                placeholder={`Command ${modelId}...`}
                onChange={handleInputChange}
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors text-sm uppercase tracking-wider"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 pt-24 px-6">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">System Core Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map(s => (
              <div key={s.name} className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between items-center hover:border-blue-500 transition-colors cursor-default group">
                <div>
                  <h3 className="font-bold text-gray-100 group-hover:text-blue-400 transition-colors">{s.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{s.health}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${s.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-2xl">
            <h3 className="text-blue-400 font-bold mb-2">Supabase Data Hub</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-blue-500"></div>
              </div>
              <span className="text-xs font-mono">LINKED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
