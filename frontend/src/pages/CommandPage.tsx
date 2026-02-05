import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendCommand } from '@/api';
import { useAssistantStore } from '@/stores/assistantStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CommandPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use global assistant store for busy state
  const { isBusy, setBusy } = useAssistantStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBusy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);
    setBusy(true);

    try {
      const result = await sendCommand(userMessage);
      if (result.ok && result.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.response, timestamp: new Date() },
        ]);
      } else if (result.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${result.error}`, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          timestamp: new Date() 
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Command</h1>
        <p className="text-slate-400 mt-1">Send direct commands to Figgy</p>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-4xl mb-4">🎱</p>
                <p className="text-lg mb-2">Ready to help</p>
                <p className="text-sm">Send a command to get started</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    <p className="text-xs mt-2 opacity-60">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isBusy && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="animate-spin text-emerald-400" size={20} />
                    <span className="text-sm text-slate-400">Figgy is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isBusy ? "Figgy is processing..." : "Type a command..."}
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60"
              disabled={isBusy}
            />
            <button
              type="submit"
              disabled={!input.trim() || isBusy}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              {isBusy ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
