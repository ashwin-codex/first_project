import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { Bot, Send, Trash2, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const AIChat: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Analyze my financial health score',
    'Explain investment basics',
    'How do I reduce my eating out expenses?',
    'Explain the 50/30/20 budget rule'
  ];

  const fetchChatHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await API.get('/chats/history');
      setMessages(res.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load chat history', 'error');
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);

    // Optimistically push user message
    const tempUserMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setQuery('');

    try {
      const res = await API.post('/chats/message', { query: textToSend });
      setMessages((prev) => [...prev, res.data]);
    } catch (error: any) {
      const responseMsg = error.response?.data?.message || 'AI coach is offline. Please try again.';
      showToast(responseMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Reset your conversational memory logs?')) return;
    try {
      await API.delete('/chats/clear');
      setMessages([]);
      showToast('Chat history cleared successfully', 'success');
    } catch (error) {
      showToast('Failed to reset memory logs', 'error');
    }
  };

  // Basic custom markdown renderer for bullets, bold, and codes
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();

      // Header H3
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-white mt-3 mb-1 font-outfit uppercase tracking-wider">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      // Header H4
      if (trimmed.startsWith('#### ')) {
        return (
          <h5 key={idx} className="text-xs font-bold text-slate-200 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
      }

      // Bullet Point
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs ml-4 list-disc text-slate-300 mt-1 leading-relaxed">
            {parseInlineMarkdown(trimmed.substring(2))}
          </li>
        );
      }

      // Order list
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="text-xs ml-4 list-decimal text-slate-300 mt-1 leading-relaxed">
            {parseInlineMarkdown(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Bold matches
    let parts: React.ReactNode[] = [text];

    // Simple code highlighting `text`
    const codeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;

    // Apply bold replacement
    let newParts: React.ReactNode[] = [];
    parts.forEach((p) => {
      if (typeof p !== 'string') {
        newParts.push(p);
        return;
      }
      const split = p.split(/\*\*([^*]+)\*\*/g);
      split.forEach((token, index) => {
        if (index % 2 === 1) {
          newParts.push(<strong key={`b-${index}`} className="font-bold text-white">{token}</strong>);
        } else {
          newParts.push(token);
        }
      });
    });

    parts = newParts;

    // Apply inline code replacement
    newParts = [];
    parts.forEach((p) => {
      if (typeof p !== 'string') {
        newParts.push(p);
        return;
      }
      const split = p.split(/`([^`]+)`/g);
      split.forEach((token, index) => {
        if (index % 2 === 1) {
          newParts.push(
            <code key={`c-${index}`} className="px-1.5 py-0.5 bg-slate-950/60 text-brand-400 font-mono text-[10px] rounded border border-white/5">
              {token}
            </code>
          );
        } else {
          newParts.push(token);
        }
      });
    });

    return newParts;
  };

  return (
    <div className="flex-1 p-6 bg-[#0b0f19] flex flex-col h-full overflow-hidden text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 flex-shrink-0">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-brand-500" />
            AI Wealth Coach
          </h1>
          <p className="text-slate-400 text-sm mt-1">Interrogate your Gemini coach for budget, savings, and investment advice</p>
        </div>
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          className="p-2.5 rounded-xl border border-white/5 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition"
          title="Reset conversation logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Chat Feed */}
        <GlassCard className="flex-1 flex flex-col justify-between p-4 min-h-0">
          {fetchingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-outfit font-bold text-base text-white">Ask PocketPilot Coach</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    I can review your expense categories, help restructure budget caps, and outline investment strategies.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 border border-white/5 text-brand-400'
                  }`}>
                    {msg.role === 'user' ? user?.name.charAt(0) : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`rounded-2xl p-4 border text-left ${
                    msg.role === 'user'
                      ? 'bg-brand-500/10 border-brand-500/20 text-slate-200 rounded-tr-none'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 rounded-tl-none'
                  }`}>
                    {renderMessageContent(msg.content)}
                    <span className="block text-[8px] text-slate-500 mt-1 font-mono text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 mr-auto items-start">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl p-4 border bg-slate-900/60 border-white/5 text-slate-400 rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    <span className="text-xs">Coach is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Form message */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(query); }}
            className="flex gap-2 border-t border-white/5 pt-4 mt-3"
          >
            <input
              type="text"
              placeholder="Ask anything about your wealth and savings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading || fetchingHistory}
              className="flex-1 px-4 py-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || fetchingHistory || !query.trim()}
              className="p-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white shadow-glow disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </GlassCard>

        {/* Info panel sidebar on desktop */}
        <div className="w-full lg:w-72 flex flex-col gap-6">
          <GlassCard>
            <h3 className="font-outfit font-bold text-sm text-white flex items-center gap-1.5 mb-3">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              Quick-Start Chips
            </h3>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading || fetchingHistory}
                  className="w-full p-3 text-left text-xs bg-slate-900 border border-white/5 hover:border-violet-500/20 hover:bg-slate-900/80 text-slate-300 hover:text-white rounded-xl transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-brand-500/5 text-xs text-slate-400 leading-relaxed font-medium">
            <span className="font-bold text-white block mb-1">Coach Memory Details:</span>
            The wealth coach reviews your transaction history and category limits for this month to formulate situational wealth guidance. Use clear queries like "reduce grocery" or "health rating".
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
export default AIChat;
