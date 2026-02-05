import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Info,
  ChevronDown,
  Save,
  RefreshCw,
  Heart,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { getConfig, patchConfig, restartGateway } from '@/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { toast } from '@/stores/notificationStore';

interface HeartbeatConfig {
  every?: string;
  activeHours?: {
    start?: string;
    end?: string;
    timezone?: string;
  };
  model?: string;
  prompt?: string;
  target?: string;
}

interface LoggingConfig {
  level?: string;
  consoleLevel?: string;
  consoleStyle?: string;
}

const logLevels = [
  { value: 'silent', label: 'Silent' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'trace', label: 'Trace' },
];

const consoleStyles = [
  { value: 'pretty', label: 'Pretty' },
  { value: 'compact', label: 'Compact' },
  { value: 'json', label: 'JSON' },
];

const thinkingLevels = [
  { value: 'off', label: 'Off' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Local edit state
  const [heartbeatEdit, setHeartbeatEdit] = useState<HeartbeatConfig | null>(null);
  const [loggingEdit, setLoggingEdit] = useState<LoggingConfig | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  const patchMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      return patchConfig(patch, data?.hash || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success('Settings saved');
      setEditingSection(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    },
  });

  const restartMutation = useMutation({
    mutationFn: restartGateway,
    onSuccess: () => {
      toast.success('Gateway restarting...');
    },
    onError: () => {
      toast.error('Failed to restart gateway');
    },
  });

  const config = data?.config || {};
  const agentsDefaults = config.agents?.defaults || {};
  const heartbeat = agentsDefaults.heartbeat || {};
  const logging = config.logging || {};

  const startEditHeartbeat = () => {
    setHeartbeatEdit({
      every: heartbeat.every || '',
      activeHours: heartbeat.activeHours || {},
      model: heartbeat.model || '',
      prompt: heartbeat.prompt || '',
      target: heartbeat.target || '',
    });
    setEditingSection('heartbeat');
  };

  const saveHeartbeat = () => {
    if (!heartbeatEdit) return;
    
    const patch: Record<string, unknown> = {};
    const hbPatch: Record<string, unknown> = {};
    
    if (heartbeatEdit.every) hbPatch.every = heartbeatEdit.every;
    if (heartbeatEdit.model) hbPatch.model = heartbeatEdit.model;
    if (heartbeatEdit.prompt) hbPatch.prompt = heartbeatEdit.prompt;
    if (heartbeatEdit.target) hbPatch.target = heartbeatEdit.target;
    if (heartbeatEdit.activeHours?.start || heartbeatEdit.activeHours?.end) {
      hbPatch.activeHours = heartbeatEdit.activeHours;
    }
    
    patch.agents = { defaults: { heartbeat: hbPatch } };
    patchMutation.mutate(patch);
  };

  const startEditLogging = () => {
    setLoggingEdit({
      level: logging.level || 'info',
      consoleLevel: logging.consoleLevel || 'info',
      consoleStyle: logging.consoleStyle || 'pretty',
    });
    setEditingSection('logging');
  };

  const saveLogging = () => {
    if (!loggingEdit) return;
    patchMutation.mutate({ logging: loggingEdit });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure OpenClaw gateway settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => restartMutation.mutate()}
            isLoading={restartMutation.isPending}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Restart Gateway
          </Button>
        </div>
      </div>

      {/* Config hash */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Info size={14} />
        <span>Config hash: {data?.hash?.slice(0, 12) || '...'}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="p-8 text-red-400">Error loading config</div>
      ) : (
        <div className="space-y-4">
          {/* Heartbeat Settings */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold text-white">Heartbeat</h2>
              </div>
              {editingSection === 'heartbeat' ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveHeartbeat}
                    isLoading={patchMutation.isPending}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={startEditHeartbeat}>
                  Edit
                </Button>
              )}
            </div>

            <div className="p-4">
              {editingSection === 'heartbeat' && heartbeatEdit ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Interval"
                    placeholder="30m"
                    value={heartbeatEdit.every || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({ ...heartbeatEdit, every: e.target.value })
                    }
                    helperText="e.g., 30m, 1h, 2h"
                  />
                  <Input
                    label="Model"
                    placeholder="Leave empty for default"
                    value={heartbeatEdit.model || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({ ...heartbeatEdit, model: e.target.value })
                    }
                  />
                  <Input
                    label="Active Hours Start"
                    placeholder="08:00"
                    value={heartbeatEdit.activeHours?.start || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({
                        ...heartbeatEdit,
                        activeHours: {
                          ...heartbeatEdit.activeHours,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    label="Active Hours End"
                    placeholder="22:00"
                    value={heartbeatEdit.activeHours?.end || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({
                        ...heartbeatEdit,
                        activeHours: {
                          ...heartbeatEdit.activeHours,
                          end: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    label="Target"
                    placeholder="last"
                    value={heartbeatEdit.target || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({ ...heartbeatEdit, target: e.target.value })
                    }
                    helperText="Delivery target (last, none, or channel)"
                  />
                  <Input
                    label="Timezone"
                    placeholder="America/Phoenix"
                    value={heartbeatEdit.activeHours?.timezone || ''}
                    onChange={(e) =>
                      setHeartbeatEdit({
                        ...heartbeatEdit,
                        activeHours: {
                          ...heartbeatEdit.activeHours,
                          timezone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Interval
                    </p>
                    <p className="text-white font-mono mt-1">
                      {heartbeat.every || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Active Hours
                    </p>
                    <p className="text-white font-mono mt-1">
                      {heartbeat.activeHours?.start && heartbeat.activeHours?.end
                        ? `${heartbeat.activeHours.start} - ${heartbeat.activeHours.end}`
                        : 'All day'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Model
                    </p>
                    <p className="text-white font-mono mt-1">
                      {heartbeat.model || 'Default'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Target
                    </p>
                    <p className="text-white font-mono mt-1">
                      {heartbeat.target || 'last'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logging Settings */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold text-white">Logging</h2>
              </div>
              {editingSection === 'logging' ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveLogging}
                    isLoading={patchMutation.isPending}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={startEditLogging}>
                  Edit
                </Button>
              )}
            </div>

            <div className="p-4">
              {editingSection === 'logging' && loggingEdit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Log Level"
                    options={logLevels}
                    value={loggingEdit.level || 'info'}
                    onChange={(e) =>
                      setLoggingEdit({ ...loggingEdit, level: e.target.value })
                    }
                  />
                  <Select
                    label="Console Level"
                    options={logLevels}
                    value={loggingEdit.consoleLevel || 'info'}
                    onChange={(e) =>
                      setLoggingEdit({ ...loggingEdit, consoleLevel: e.target.value })
                    }
                  />
                  <Select
                    label="Console Style"
                    options={consoleStyles}
                    value={loggingEdit.consoleStyle || 'pretty'}
                    onChange={(e) =>
                      setLoggingEdit({ ...loggingEdit, consoleStyle: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Log Level
                    </p>
                    <p className="text-white font-mono mt-1">
                      {logging.level || 'info'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Console Level
                    </p>
                    <p className="text-white font-mono mt-1">
                      {logging.consoleLevel || 'info'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Console Style
                    </p>
                    <p className="text-white font-mono mt-1">
                      {logging.consoleStyle || 'pretty'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent Defaults */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="font-semibold text-white">Agent Defaults</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Primary Model
                  </p>
                  <p className="text-white font-mono mt-1 text-sm">
                    {agentsDefaults.model?.primary || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Workspace
                  </p>
                  <p className="text-white font-mono mt-1 text-sm truncate">
                    {agentsDefaults.workspace || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Thinking Default
                  </p>
                  <p className="text-white font-mono mt-1 text-sm">
                    {agentsDefaults.thinkingDefault || 'off'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Max Concurrent
                  </p>
                  <p className="text-white font-mono mt-1 text-sm">
                    {agentsDefaults.maxConcurrent || 4}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Other Sections (read-only) */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="divide-y divide-slate-700">
              <ConfigSection title="Channels" data={config.channels} />
              <ConfigSection title="Gateway" data={config.gateway} />
              <ConfigSection title="Session" data={config.session} />
              <ConfigSection title="Cron" data={config.cron} />
              <ConfigSection title="Tools" data={config.tools} />
            </div>
          </div>

          {/* Full JSON */}
          <details className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <summary className="p-4 cursor-pointer text-slate-400 hover:text-white flex items-center gap-2">
              <ChevronDown size={16} />
              View full configuration (JSON)
            </summary>
            <pre className="p-4 text-xs overflow-auto max-h-96 bg-slate-900/50 text-slate-300">
              {JSON.stringify(config, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function ConfigSection({ title, data }: { title: string; data: unknown }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <span className="font-medium text-white">{title}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <pre className="p-3 rounded-xl bg-slate-900/50 text-xs overflow-auto max-h-64 text-slate-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
