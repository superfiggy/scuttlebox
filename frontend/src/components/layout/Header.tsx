import { useQuery } from '@tanstack/react-query';
import { Activity, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { getAgentStatus, getGatewayHealth } from '@/api';
import { useAssistantStore } from '@/stores/assistantStore';

export default function Header() {
  const { isBusy } = useAssistantStore();

  const { data: status } = useQuery({
    queryKey: ['agent-status'],
    queryFn: getAgentStatus,
    refetchInterval: 5000,
  });

  const { data: health } = useQuery({
    queryKey: ['gateway-health'],
    queryFn: getGatewayHealth,
    refetchInterval: 10000,
  });

  // Show busy if either local portal is busy OR server reports busy
  const isProcessing = isBusy || status?.busy;

  return (
    <header className="h-16 border-b border-slate-700 bg-slate-800/30 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">🎱</span>
          Scuttlebox
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isProcessing 
            ? 'bg-amber-500/20 border border-amber-500/30' 
            : 'bg-slate-700/50'
        }`}>
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-sm text-amber-300 font-medium">Processing</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-slate-300">Idle</span>
            </>
          )}
        </div>

        {/* Sessions count */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {status?.active_sessions || 0} sessions
          </span>
        </div>

        {/* Gateway status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50">
          {health === undefined ? (
            <>
              <Wifi className="w-4 h-4 text-slate-400 animate-pulse" />
              <span className="text-sm text-slate-400">Checking...</span>
            </>
          ) : health?.ok ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Disconnected</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
