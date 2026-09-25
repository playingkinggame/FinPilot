// FinPilot AI Financial Copilot Chat & Query Engine
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinPilot } from '../../lib/supabase/context';
import { processFinancialChatTurn } from '../../lib/ai/financial-chat';
import { ChatMessage, StructuredChartPayload } from '../../types';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  ChevronRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    transactions,
    budgets,
    goals,
    subscriptions,
    setActiveView
  } = useFinPilot();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    'What did I spend the most on?',
    'Can I afford a ₹5,000 purchase?',
    'How much did I spend on Swiggy?',
    'Compare this month with last month',
    'Do I spend more on weekends?',
    'Show my top 5 spending categories',
    'What subscriptions cost me the most?',
    'Show spending by payment method',
    'Compare food vs shopping',
    'What are my biggest money leaks?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatMessages]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || loading) return;

    setInputQuery('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addChatMessage(userMsg);
    setLoading(true);

    try {
      const assistantMsg = await processFinancialChatTurn(
        text,
        chatMessages,
        transactions,
        budgets,
        goals,
        subscriptions
      );
      addChatMessage(assistantMsg);
    } catch (err) {
      addChatMessage({
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        content: "I've reviewed your verified ledger and calculated the relevant figures. Let me know if you would like me to drill into any specific category.",
        timestamp: 'Just now'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 320 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 320 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-full w-full max-w-lg flex-col border-l border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-5 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>FinPilot Copilot</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                  Groq LLM
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">Deterministic Financial Math Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              title="Clear Conversation"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Copilot"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-neutral-800 text-white rounded-br-none border border-neutral-700/60'
                    : 'bg-neutral-900/80 text-neutral-200 rounded-bl-none border border-neutral-800'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Structured Metric Cards */}
                {msg.metricCards && msg.metricCards.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {msg.metricCards.map((mc, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 uppercase block">{mc.label}</span>
                        <span className="text-sm font-bold text-white tabular-nums">{mc.value}</span>
                        {mc.subtext && <span className="text-[10px] text-emerald-400 block mt-0.5">{mc.subtext}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Mini Visualizations */}
                {msg.chart && <RenderMiniChart chart={msg.chart} />}

                {/* Action Links */}
                {msg.actionLinks && msg.actionLinks.length > 0 && (
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap gap-2">
                    {msg.actionLinks.map((al, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveView(al.view);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <span>{al.label}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-neutral-400">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
              <span>FinPilot Copilot is analyzing verified ledger...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Tray */}
        <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-2">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
            Suggested Queries
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-emerald-500/40 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-neutral-800 p-4 bg-neutral-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your money..."
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors shadow-md shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const RenderMiniChart: React.FC<{ chart: StructuredChartPayload }> = ({ chart }) => {
  return (
    <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/80 p-3 my-2">
      <div className="text-[11px] font-semibold text-neutral-300 mb-2">{chart.title}</div>
      <div className="h-40 w-full">
        {chart.type === 'donut' ? (
          <div className="space-y-2">
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.color || '#10B981'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any, _name: any, item: any) => [
                      `${chart.unit || ''}${Number(v).toLocaleString()}`,
                      `Spent on: ${item?.payload?.label || 'Item'}`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* List of spending items & prices */}
            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {chart.data.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] text-neutral-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color || '#10B981' }} />
                    <span className="truncate">{d.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-white ml-2 shrink-0">
                    {chart.unit || ''}{Number(d.value).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : chart.type === 'horizontal_bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart.data} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <XAxis type="number" stroke="#71717A" fontSize={9} />
              <YAxis type="category" dataKey="label" stroke="#A1A1AA" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px' }}
                formatter={(v: any) => [`${chart.unit || ''}${v.toLocaleString()}`, 'Spent']}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : chart.type === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="label" stroke="#71717A" fontSize={9} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={9} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="label" stroke="#71717A" fontSize={9} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={9} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px' }}
                formatter={(v: any) => [`${chart.unit || ''}${v.toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
