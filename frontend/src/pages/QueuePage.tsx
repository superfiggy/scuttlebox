import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, RefreshCw, Settings2, Loader2, Save } from 'lucide-react';
import { getQueueStatus, updateQueueConfig } from '@/api';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { toast } from '@/stores/notificationStore';
import { cn } from '@/utils/cn';

const queueModes = [
  { value: 'collect', label: 'Collect (coalesce into single turn)' },
  { value: 'steer', label: 'Steer (inject into current run)' },
  { value: 'followup', label: 'Followup (enqueue for next turn)' },
  { value: 'steer-backlog', label: 'Steer + Backlog (steer & preserve)' },
  { value: 'interrupt', label: 'Interrupt (abort & run newest)' },
];

const dropModes = [
  { value: 'summarize', label: 'Summarize (keep bullet list)' },
  { value: 'old', label: 'Drop Old' },
  { value: 'new', label: 'Drop New' },
];

export default function QueuePage() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [localConfig, setLocalConfig] = useState<{
    mode: string;
    debounceMs: number;
    cap: number;
    drop: string;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['queueStatus'],
    queryFn: getQueueStatus,
    refetchInterval: 10000, // Refresh every 10s
  });

  const updateMutation = useMutation({
    mutationFn: updateQueueConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueStatus'] });
      toast.success('Queue config updated');
      setEditMode(false);
    },
    onError: () => {
      toast.error('Failed to update queue config');
    },
  });

  const config = data?.config;
  const sessions = data?.sessions || [];

  const handleStartEdit = () => {
    if (config) {
      setLocalConfig({ ...config });
      setEditMode(true);
    }
  };

  const handleSave = () => {
    if (localConfig) {
      updateMutation.mutate(localConfig);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setLocalConfig(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="text-slate-400" />
            Queue
          </h1>
          <p className="text-slate-400 mt-1">
            Message queue configuration and session status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Queue Configuration Card */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-400" />
                Queue Configuration
              </h2>
              {!editMode ? (
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    isLoading={updateMutation.isPending}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {editMode && localConfig ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Queue Mode"
                  options={queueModes}
                  value={localConfig.mode}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, mode: e.target.value })
                  }
                />
                <Input
                  label="Debounce (ms)"
                  type="number"
                  value={localConfig.debounceMs.toString()}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      debounceMs: parseInt(e.target.value) || 0,
                    })
                  }
                  helperText="Wait time before starting followup turn"
                />
                <Input
                  label="Cap (max messages)"
                  type="number"
                  value={localConfig.cap.toString()}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      cap: parseInt(e.target.value) || 1,
                    })
                  }
                  helperText="Maximum queued messages per session"
                />
                <Select
                  label="Drop Policy"
                  options={dropModes}
                  value={localConfig.drop}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, drop: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Mode
                  </p>
                  <p className="text-white font-mono mt-1">{config?.mode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Debounce
                  </p>
                  <p className="text-white font-mono mt-1">
                    {config?.debounceMs}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Cap
                  </p>
                  <p className="text-white font-mono mt-1">{config?.cap}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Drop Policy
                  </p>
                  <p className="text-white font-mono mt-1">{config?.drop}</p>
                </div>
              </div>
            )}

            {config?.byChannel && Object.keys(config.byChannel).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">
                  Per-Channel Overrides:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(config.byChannel).map(([channel, mode]) => (
                    <span
                      key={channel}
                      className="px-2 py-1 rounded-lg bg-slate-700/50 text-sm text-slate-300"
                    >
                      {channel}: {mode as string}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Active Sessions ({sessions.length})
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Sessions are processed through the queue system
              </p>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No active sessions
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {sessions.map((session: {
                  sessionKey: string;
                  displayName: string;
                  channel: string | null;
                  updatedAt: number | null;
                  model: string | null;
                }) => (
                  <div
                    key={session.sessionKey}
                    className="p-4 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {session.displayName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                          {session.sessionKey}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {session.channel && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              'bg-blue-500/20 text-blue-400'
                            )}
                          >
                            {session.channel}
                          </span>
                        )}
                        {session.model && (
                          <span className="text-xs text-slate-500">
                            {session.model}
                          </span>
                        )}
                        {session.updatedAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(session.updatedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              About Queue Modes
            </h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>
                <strong className="text-slate-300">collect</strong>: Coalesce
                queued messages into a single followup turn (default)
              </li>
              <li>
                <strong className="text-slate-300">steer</strong>: Inject
                messages into the current run immediately
              </li>
              <li>
                <strong className="text-slate-300">followup</strong>: Enqueue
                for the next agent turn
              </li>
              <li>
                <strong className="text-slate-300">steer-backlog</strong>: Steer
                now AND preserve for followup
              </li>
              <li>
                <strong className="text-slate-300">interrupt</strong>: Abort
                current run, run newest message
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
