import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  Activity,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
} from 'lucide-react';
import { getAgentStatus, getGatewayHealth, getSessions, sendCommand, getSessionHistory } from '@/api';
import { useAssistantStore } from '@/stores/assistantStore';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

// AI Avatar Component with busy session indicator
function AIAvatar({ 
  status, 
  busySessionName,
  busySessionChannel,
}: { 
  status: 'idle' | 'processing' | 'error';
  busySessionName?: string | null;
  busySessionChannel?: string | null;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('ai-avatar-container')?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const configs = {
    processing: {
      glowColor: 'rgba(34, 197, 94, 0.6)',
      coreColor: '#22c55e',
      label: 'Processing',
      pulseSpeed: '1s',
    },
    idle: {
      glowColor: 'rgba(100, 116, 139, 0.4)',
      coreColor: '#64748b',
      label: 'Idle',
      pulseSpeed: '3s',
    },
    error: {
      glowColor: 'rgba(239, 68, 68, 0.4)',
      coreColor: '#ef4444',
      label: 'Disconnected',
      pulseSpeed: '2s',
    },
  };

  const config = configs[status];

  return (
    <div
      id="ai-avatar-container"
      className="relative w-full aspect-square max-w-[240px] mx-auto"
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-30 blur-xl transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          animation: `pulse ${config.pulseSpeed} ease-in-out infinite`,
        }}
      />

      {/* Orbital rings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 200"
        style={{
          transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.coreColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={config.coreColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={config.coreColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <ellipse
          cx="100" cy="100" rx="60" ry="20"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="1"
          className={status === 'processing' ? 'animate-spin' : ''}
          style={{ 
            animationDuration: status === 'processing' ? '3s' : '8s', 
            transformOrigin: 'center' 
          }}
        />
        <ellipse
          cx="100" cy="100" rx="75" ry="30"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="0.5"
          className={status === 'processing' ? 'animate-spin' : ''}
          style={{ 
            animationDuration: status === 'processing' ? '4s' : '12s', 
            animationDirection: 'reverse', 
            transformOrigin: 'center' 
          }}
        />
      </svg>

      {/* Core sphere with emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${config.coreColor}40 0%, ${config.coreColor}20 50%, transparent 100%)`,
            boxShadow: `0 0 60px ${config.glowColor}, inset 0 0 40px ${config.glowColor}`,
            animation: `breathe ${config.pulseSpeed} ease-in-out infinite`,
          }}
        >
          <span className="text-4xl select-none">🎱</span>
        </div>
      </div>

      {/* Status label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: config.coreColor,
              boxShadow: `0 0 8px ${config.coreColor}`,
              animation: `pulse ${config.pulseSpeed} ease-in-out infinite`,
            }}
          />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: config.coreColor }}>
            {config.label}
          </span>
        </div>
        
        {/* Busy session indicator */}
        {status === 'processing' && busySessionName && (
          <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
            <span className="text-xs text-emerald-400 truncate max-w-[150px]">
              {busySessionName}
            </span>
            {busySessionChannel && (
              <span className="text-xs text-emerald-600">({busySessionChannel})</span>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  accentColor = '#22c55e'
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  accentColor?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50">
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-mono font-bold text-white">{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// Expandable Session Card
function SessionCard({ session }: { session: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['sessionHistory', session.key],
    queryFn: () => getSessionHistory(session.key, 10),
    enabled: isExpanded,
  });

  const messages = historyData?.details?.messages || historyData?.messages || [];

  return (
    <div className="rounded-xl bg-slate-700/30 overflow-hidden transition-all">
      {/* Session Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-all"
      >
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">
            {session.displayName || session.key}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{session.channel || 'direct'}</span>
            {session.model && (
              <span className="text-xs text-slate-600">{session.model}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {session.updatedAt
              ? formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })
              : '--'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded History */}
      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {historyLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No messages yet
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {messages.slice(0, 5).map((msg: any, idx: number) => {
                const content = typeof msg.content === 'string' 
                  ? msg.content 
                  : msg.content?.find?.((b: any) => b.type === 'text')?.text || '';
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 border-b border-slate-700/30 last:border-b-0',
                      msg.role === 'assistant' ? 'bg-slate-800/30' : ''
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center',
                          msg.role === 'assistant'
                            ? 'bg-emerald-500/20'
                            : 'bg-blue-500/20'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <Bot className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <User className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 line-clamp-3">
                          {content.slice(0, 200)}
                          {content.length > 200 ? '...' : ''}
                        </p>
                        {msg.timestamp && (
                          <p className="text-xs text-slate-600 mt-1">
                            {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [chatInput, setChatInput] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  
  // Use the global assistant store for state management
  const { status: assistantStatus, isBusy, setBusy } = useAssistantStore();

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['agent-status'],
    queryFn: getAgentStatus,
    refetchInterval: 3000, // More frequent updates
  });

  const { data: health } = useQuery({
    queryKey: ['gateway-health'],
    queryFn: getGatewayHealth,
    refetchInterval: 10000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(60),
    refetchInterval: 15000,
  });

  // Determine the display status: local busy state takes priority
  const displayStatus = isBusy ? 'processing' : (status?.busy ? 'processing' : (health?.ok ? 'idle' : 'error'));
  
  // Get busy session info from status
  const busySessionName = status?.current_session_name;
  const busySessionChannel = status?.current_session_channel;

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isBusy) return;
    
    const message = chatInput.trim();
    setChatInput('');
    setBusy(true);
    
    try {
      const result = await sendCommand(message);
      if (result.ok && result.response) {
        setLastResponse(result.response);
      } else if (result.error) {
        setLastResponse(`Error: ${result.error}`);
      }
      // Refetch status after command completes
      refetchStatus();
    } catch (error) {
      console.error('Failed to send message:', error);
      setLastResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const sessions = sessionsData?.sessions || [];

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome to <span className="text-emerald-400">Scuttlebox</span>
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">
            {health?.ok ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected to OpenClaw Gateway
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Connecting...
              </span>
            )}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - AI Avatar & Chat */}
          <div className="lg:col-span-5 space-y-6">
            {/* AI Avatar Card */}
            <div className="relative rounded-3xl bg-slate-800/30 border border-slate-700/50 p-8 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-emerald-500/30 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-emerald-500/30 rounded-br-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Figgy
                    </h2>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                      AI Assistant
                    </p>
                  </div>
                </div>

                <AIAvatar 
                  status={displayStatus} 
                  busySessionName={busySessionName}
                  busySessionChannel={busySessionChannel}
                />
              </div>
            </div>

            {/* Quick Chat */}
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Message
              </h3>

              {lastResponse && (
                <div className="mb-4 p-3 rounded-lg bg-slate-700/50 text-sm text-slate-200 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{lastResponse}</pre>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isBusy ? "Figgy is thinking..." : "Ask Figgy anything..."}
                  disabled={isBusy}
                  className={cn(
                    "w-full h-24 rounded-xl bg-slate-900/50 border border-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all",
                    isBusy && "opacity-60 cursor-not-allowed"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isBusy}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Sessions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Activity}
                label="Status"
                value={displayStatus === 'processing' ? 'Busy' : (displayStatus === 'error' ? 'Error' : 'Idle')}
                accentColor={displayStatus === 'processing' ? '#f59e0b' : (displayStatus === 'error' ? '#ef4444' : '#22c55e')}
              />
              <StatCard
                icon={MessageSquare}
                label="Active Sessions"
                value={status?.active_sessions || 0}
                accentColor="#3b82f6"
              />
              <StatCard
                icon={CheckCircle2}
                label="Gateway"
                value={health?.ok ? 'Online' : 'Offline'}
                accentColor={health?.ok ? '#22c55e' : '#ef4444'}
              />
              <StatCard
                icon={Clock}
                label="Recent Sessions"
                value={sessions.length}
                accentColor="#a855f7"
              />
            </div>

            {/* Recent Sessions - Expandable */}
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Recent Sessions (Last Hour)
                <span className="text-xs text-slate-500 font-normal ml-1">
                  Click to expand
                </span>
              </h3>

              <div className="space-y-2">
                {sessions.length > 0 ? (
                  sessions.slice(0, 8).map((session: any) => (
                    <SessionCard key={session.key} session={session} />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No recent sessions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
