import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  User,
  Bot,
  Wrench,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';
import { getLogs, getLogSessions, getLogChannels } from '@/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface LogMessage {
  session_key: string;
  session_name: string | null;
  channel: string | null;
  role: string;
  content: string;
  timestamp: number | null;
  model: string | null;
  tool_name: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
}

const roleConfig: Record<string, { icon: typeof User; color: string; label: string }> = {
  user: { icon: User, color: 'text-blue-400', label: 'User' },
  assistant: { icon: Bot, color: 'text-emerald-400', label: 'Assistant' },
  system: { icon: AlertCircle, color: 'text-amber-400', label: 'System' },
  tool: { icon: Wrench, color: 'text-purple-400', label: 'Tool' },
};

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeTools, setIncludeTools] = useState(false);
  const [offset, setOffset] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const limit = 50;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, sessionFilter, channelFilter, roleFilter, includeTools]);

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['logs', debouncedSearch, sessionFilter, channelFilter, roleFilter, includeTools, offset],
    queryFn: () =>
      getLogs({
        search: debouncedSearch || undefined,
        sessionKey: sessionFilter || undefined,
        channel: channelFilter || undefined,
        role: roleFilter || undefined,
        includeTools,
        limit,
        offset,
      }),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['logSessions'],
    queryFn: getLogSessions,
  });

  const { data: channelsData } = useQuery({
    queryKey: ['logChannels'],
    queryFn: getLogChannels,
  });

  const messages = logsData?.messages || [];
  const total = logsData?.total || 0;
  const hasMore = logsData?.has_more || false;

  const sessions = sessionsData?.sessions || [];
  const channels = channelsData?.channels || [];

  const sessionOptions = [
    { value: '', label: 'All Sessions' },
    ...sessions.map((s: { key: string; displayName: string }) => ({
      value: s.key,
      label: s.displayName || s.key.slice(0, 30),
    })),
  ];

  const channelOptions = [
    { value: '', label: 'All Channels' },
    ...channels.map((ch: string) => ({ value: ch, label: ch })),
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'system', label: 'System' },
  ];

  const toggleExpanded = (index: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSessionFilter('');
    setChannelFilter('');
    setRoleFilter('');
    setIncludeTools(false);
    setOffset(0);
  };

  const hasActiveFilters = search || sessionFilter || channelFilter || roleFilter || includeTools;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="text-slate-400" />
            Logs
          </h1>
          <p className="text-slate-400 mt-1">
            Search and browse chat history across all sessions
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <Select
            options={sessionOptions}
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            placeholder="Session"
          />

          <Select
            options={channelOptions}
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            placeholder="Channel"
          />

          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="Role"
          />
        </div>

        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={includeTools}
              onChange={(e) => setIncludeTools(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            Include tool calls
          </label>

          <span className="text-sm text-slate-500">
            {total} message{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {messages.map((msg: LogMessage, idx: number) => {
              const config = roleConfig[msg.role] || roleConfig.user;
              const Icon = config.icon;
              const isExpanded = expandedMessages.has(idx);
              const isLong = msg.content.length > 300;

              return (
                <div
                  key={idx}
                  className="p-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Role Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                        msg.role === 'assistant'
                          ? 'bg-emerald-500/20'
                          : msg.role === 'user'
                          ? 'bg-blue-500/20'
                          : 'bg-slate-700/50'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn('text-sm font-medium', config.color)}>
                          {config.label}
                        </span>
                        {msg.session_name && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">
                            {msg.session_name}
                          </span>
                        )}
                        {msg.channel && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400">
                            {msg.channel}
                          </span>
                        )}
                        {msg.model && (
                          <span className="text-xs text-slate-600">{msg.model}</span>
                        )}
                        {msg.timestamp && (
                          <span className="text-xs text-slate-600 ml-auto">
                            {formatDistanceToNow(new Date(msg.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={cn(
                          'text-sm text-slate-300 whitespace-pre-wrap break-words',
                          !isExpanded && isLong && 'line-clamp-4'
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* Expand/Collapse */}
                      {isLong && (
                        <button
                          onClick={() => toggleExpanded(idx)}
                          className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              Show more
                            </>
                          )}
                        </button>
                      )}

                      {/* Token info */}
                      {(msg.tokens_in || msg.tokens_out) && (
                        <div className="mt-2 text-xs text-slate-600">
                          {msg.tokens_in && <span>In: {msg.tokens_in}</span>}
                          {msg.tokens_in && msg.tokens_out && <span> · </span>}
                          {msg.tokens_out && <span>Out: {msg.tokens_out}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {(offset > 0 || hasMore) && (
          <div className="p-4 border-t border-slate-700 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
