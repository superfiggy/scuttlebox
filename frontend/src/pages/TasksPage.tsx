import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Pause, Trash2, Clock, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { getCronJobs, runCronJob, pauseCronJob, resumeCronJob, deleteCronJob } from '@/api';
import type { CronJob, CronJobsResponse } from '@/types';
import { cn } from '@/utils/cn';
import CreateTaskModal from '@/components/forms/CreateTaskModal';
import Button from '@/components/common/Button';
import { toast } from '@/stores/notificationStore';

function formatSchedule(job: CronJob): string {
  const { schedule } = job;
  if (schedule.kind === 'cron') {
    return `Cron: ${schedule.expr}`;
  }
  if (schedule.kind === 'every') {
    const ms = schedule.everyMs;
    if (ms >= 86400000) return `Every ${Math.floor(ms / 86400000)}d`;
    if (ms >= 3600000) return `Every ${Math.floor(ms / 3600000)}h`;
    if (ms >= 60000) return `Every ${Math.floor(ms / 60000)}m`;
    return `Every ${Math.floor(ms / 1000)}s`;
  }
  if (schedule.kind === 'at') {
    return `At: ${new Date(schedule.atMs).toLocaleString()}`;
  }
  return 'Unknown';
}

function formatNextRun(timestamp: number | undefined): string {
  if (!timestamp) return 'Not scheduled';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Overdue';
  if (diff < 60000) return 'In less than a minute';
  if (diff < 3600000) return `In ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `In ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleString();
}

export default function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(true);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cronJobs', includeDisabled],
    queryFn: async () => {
      const response = await getCronJobs(includeDisabled);
      return response as CronJobsResponse;
    },
  });

  const runMutation = useMutation({
    mutationFn: runCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      toast.success('Task triggered');
    },
    onError: () => {
      toast.error('Failed to run task');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      toast.success('Task paused');
    },
    onError: () => {
      toast.error('Failed to pause task');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      toast.success('Task resumed');
    },
    onError: () => {
      toast.error('Failed to resume task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      toast.success('Task deleted');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduled Tasks</h1>
          <p className="text-slate-400 mt-1">
            Manage automated tasks and cron jobs
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
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Task
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-white">No tasks yet</h3>
          <p className="mt-2 text-slate-400">
            Create your first scheduled task to automate AI interactions
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4" leftIcon={<Plus className="h-4 w-4" />}>
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const jobId = job.jobId || job.id;
            return (
              <div
                key={jobId}
                className={cn(
                  'rounded-2xl border bg-slate-800/50 p-5 transition-all',
                  job.enabled
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-700/50 opacity-60'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-white truncate">
                        {job.name || `Task ${jobId.slice(0, 8)}`}
                      </h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          job.enabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        )}
                      >
                        {job.enabled ? 'active' : 'paused'}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          job.sessionTarget === 'main'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        )}
                      >
                        {job.sessionTarget}
                      </span>
                    </div>
                    
                    {/* Payload preview */}
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                      {job.payload.kind === 'systemEvent'
                        ? job.payload.text
                        : job.payload.message}
                    </p>
                    
                    {/* Schedule info */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500 font-mono flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatSchedule(job)}
                      </span>
                      {job.nextRunAt && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Next: {formatNextRun(job.nextRunAt)}
                        </span>
                      )}
                      {job.runCount !== undefined && job.runCount > 0 && (
                        <span>Runs: {job.runCount}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => runMutation.mutate(jobId)}
                      disabled={runMutation.isPending}
                      className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      title="Run now"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    {job.enabled ? (
                      <button
                        onClick={() => pauseMutation.mutate(jobId)}
                        disabled={pauseMutation.isPending}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => resumeMutation.mutate(jobId)}
                        disabled={resumeMutation.isPending}
                        className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        title="Resume"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteMutation.mutate(jobId);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
