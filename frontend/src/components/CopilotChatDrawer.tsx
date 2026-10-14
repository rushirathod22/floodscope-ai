import React, { useState } from 'react';
import { Bot, Send, User, ShieldAlert, Sparkles, X, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import type { CopilotChatResponse } from '../services/api';

interface CopilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId?: string;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  recommendedActions?: string[];
  groundedMetrics?: any;
  time: string;
}

export const CopilotChatDrawer: React.FC<CopilotChatDrawerProps> = ({
  isOpen,
  onClose,
  analysisId = 'latest'
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello, I am the FloodScope Tactical Rescuer Copilot. Every metric and road connectivity state I report is deterministically computed from your satellite maps and road graphs. How can I assist field operations today?',
      recommendedActions: [
        'Ask about isolated settlements with no hospital road access.',
        'Ask for road kilometers and bridge vulnerability counts.',
        'Request guidance in English or Nepali (नेपाली).'
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const resp: CopilotChatResponse = await api.copilotChat(textToSend, language, analysisId);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: resp.answer,
        recommendedActions: resp.recommended_actions,
        groundedMetrics: resp.grounded_metrics,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error retrieving grounded telemetry: ${err.message || 'Server timeout'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePromptsEn = [
    'Which settlements are completely cut off from road access?',
    'How many km of roads and bridges are flooded?',
    'What is the candidate flood area in hectares?'
  ];

  const samplePromptsNe = [
    'कुन कुन बस्तीहरू सम्पर्कविहीन छन्?',
    'बाढीले कति सडक र पुल ढाकेको छ?',
    'उद्धार टोलीका लागि मुख्य सिफारिस के के छन्?'
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-50 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Rescuer AI Copilot</h3>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                100% GROUNDED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Zero Hallucinations • Real-Time Graph Queries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                language === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ne')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                language === 'ne' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              नेपाली
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-cyan-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span>FloodScope AI Copilot</span>
                </>
              )}
              <span>• {msg.time}</span>
            </div>

            <div
              className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Recommended Actions */}
              {msg.recommendedActions && msg.recommendedActions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Recommended Actions
                  </span>
                  <ul className="space-y-1">
                    {msg.recommendedActions.map((act, aIdx) => (
                      <li key={aIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Querying geospatial graph and verifying metrics...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Tactical Quick Queries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(language === 'ne' ? samplePromptsNe : samplePromptsEn).map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-left transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === 'ne'
              ? 'उद्धार सम्बन्धी प्रश्न सोध्नुहोस्...'
              : 'Ask rescuer question (e.g. Which towns are cut off?)...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-40 text-white rounded-xl shadow-md transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
