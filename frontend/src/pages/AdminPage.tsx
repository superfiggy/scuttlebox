import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Server,
  RefreshCw,
  Power,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Terminal,
} from 'lucide-react';
import { getGatewayHealth, restartGateway } from '@/api';
import { toast } from '@/stores/notificationStore';

export default function AdminPage() {
  const [restartConfirm, setRestartConfirm] = useState(false);

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['gateway-health'],
    queryFn: getGatewayHealth,
    refetchInterval: 10000,
  });

  const restartMutation = useMutation({
    mutationFn: restartGateway,
    onSuccess: () => {
      setRestartConfirm(false);
      toast.success('Gateway restart initiated');
      setTimeout(() => refetchHealth(), 3000);
    },
    onError: () => {
      toast.error('Failed to restart gateway');
    },
  });

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Server className="text-slate-400" />
          Server Administration
        </h1>
        <p className="text-slate-400 mt-1">Manage the OpenClaw gateway</p>
      </div>

      {/* Gateway Status */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Gateway Status</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {health?.ok ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Wifi className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-400">Online</p>
                  <p className="text-sm text-slate-400">
                    Uptime: {health.uptime_seconds ? formatUptime(health.uptime_seconds) : 'Unknown'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <WifiOff className="text-red-400" size={24} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-red-400">Offline</p>
                  <p className="text-sm text-slate-400">Gateway is not responding</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => refetchHealth()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Channels */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Connected Channels</h2>
        {health?.channels && Object.keys(health.channels).length > 0 ? (
          <div className="grid gap-3">
            {Object.entries(health.channels).map(([channel, status]) => (
              <div
                key={channel}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl"
              >
                <span className="font-medium text-white capitalize">{channel}</span>
                <div className="flex items-center gap-2">
                  {(status as any)?.connected ? (
                    <CheckCircle className="text-emerald-400" size={18} />
                  ) : (
                    <AlertTriangle className="text-amber-400" size={18} />
                  )}
                  <span className="text-sm text-slate-400">
                    {(status as any)?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No channel information available</p>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
        
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
          <div>
            <h3 className="font-medium text-white">Restart Gateway</h3>
            <p className="text-sm text-slate-400">Restart the OpenClaw gateway process</p>
          </div>
          {restartConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-400">Are you sure?</span>
              <button
                onClick={() => restartMutation.mutate()}
                disabled={restartMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-colors"
              >
                <Power size={16} />
                Confirm
              </button>
              <button
                onClick={() => setRestartConfirm(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRestartConfirm(true)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              <Power size={16} />
              Restart
            </button>
          )}
        </div>

        {restartMutation.isSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle size={18} />
            <span>Gateway restart initiated</span>
          </div>
        )}
      </div>

      {/* CLI Commands */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Terminal size={18} />
          CLI Commands
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { cmd: 'openclaw status', desc: 'Check status' },
            { cmd: 'openclaw health', desc: 'Health check' },
            { cmd: 'openclaw sessions', desc: 'List sessions' },
            { cmd: 'openclaw logs', desc: 'View logs' },
          ].map((item) => (
            <div key={item.cmd} className="p-3 bg-slate-700/30 rounded-xl">
              <code className="text-sm text-emerald-400">{item.cmd}</code>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Run these commands in your terminal for more detailed information.
        </p>
      </div>
    </div>
  );
}
