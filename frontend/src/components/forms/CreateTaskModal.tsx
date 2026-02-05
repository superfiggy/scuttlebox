import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { createCronJob } from '@/api';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Select from '@/components/common/Select';
import { toast } from '@/stores/notificationStore';
import type { SessionTarget, ScheduleKind } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sessionTargetOptions = [
  { value: 'main', label: 'Main Session (systemEvent)' },
  { value: 'isolated', label: 'Isolated Session (agentTurn)' },
];

const scheduleTypeOptions = [
  { value: 'cron', label: 'Cron Expression' },
  { value: 'every', label: 'Interval' },
  { value: 'at', label: 'One Time' },
];

const commonIntervals = [
  { value: '60000', label: 'Every minute' },
  { value: '300000', label: 'Every 5 minutes' },
  { value: '900000', label: 'Every 15 minutes' },
  { value: '1800000', label: 'Every 30 minutes' },
  { value: '3600000', label: 'Every hour' },
  { value: '86400000', label: 'Every day' },
];

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [sessionTarget, setSessionTarget] = useState<SessionTarget>('main');
  const [promptText, setPromptText] = useState('');
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>('cron');
  const [cronExpr, setCronExpr] = useState('0 9 * * *');
  const [cronTz, setCronTz] = useState('');
  const [intervalMs, setIntervalMs] = useState('3600000');
  const [customIntervalMs, setCustomIntervalMs] = useState('');
  const [atDateTime, setAtDateTime] = useState('');
  
  // Advanced options for isolated sessions
  const [model, setModel] = useState('');
  const [thinking, setThinking] = useState('');
  const [deliverResult, setDeliverResult] = useState(false);
  const [deliverChannel, setDeliverChannel] = useState('');
  const [deliverTo, setDeliverTo] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      // Build schedule
      let schedule: Record<string, unknown>;
      if (scheduleKind === 'cron') {
        schedule = { kind: 'cron', expr: cronExpr };
        if (cronTz) schedule.tz = cronTz;
      } else if (scheduleKind === 'every') {
        const ms = customIntervalMs ? parseInt(customIntervalMs) : parseInt(intervalMs);
        schedule = { kind: 'every', everyMs: ms };
      } else {
        const atMs = new Date(atDateTime).getTime();
        schedule = { kind: 'at', atMs };
      }

      // Build payload
      let payload: Record<string, unknown>;
      if (sessionTarget === 'main') {
        payload = { kind: 'systemEvent', text: promptText };
      } else {
        payload = { kind: 'agentTurn', message: promptText };
        if (model) payload.model = model;
        if (thinking) payload.thinking = thinking;
        if (deliverResult) {
          payload.deliver = true;
          if (deliverChannel) payload.channel = deliverChannel;
          if (deliverTo) payload.to = deliverTo;
        }
      }

      return createCronJob({
        name: name || undefined,
        schedule,
        payload,
        sessionTarget,
        enabled: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronJobs'] });
      toast.success('Task created');
      handleClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    },
  });

  const handleClose = () => {
    // Reset form
    setName('');
    setSessionTarget('main');
    setPromptText('');
    setScheduleKind('cron');
    setCronExpr('0 9 * * *');
    setCronTz('');
    setIntervalMs('3600000');
    setCustomIntervalMs('');
    setAtDateTime('');
    setModel('');
    setThinking('');
    setDeliverResult(false);
    setDeliverChannel('');
    setDeliverTo('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const isValid = promptText.trim() && (
    (scheduleKind === 'cron' && cronExpr.trim()) ||
    (scheduleKind === 'every' && (intervalMs || customIntervalMs)) ||
    (scheduleKind === 'at' && atDateTime)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Scheduled Task"
      description="Set up an automated task that runs on a schedule."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Task Name"
          placeholder="Enter task name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Select
          label="Session Target"
          options={sessionTargetOptions}
          value={sessionTarget}
          onChange={(e) => setSessionTarget(e.target.value as SessionTarget)}
        />

        <Textarea
          label={sessionTarget === 'main' ? 'System Event Text' : 'Agent Message'}
          placeholder={
            sessionTarget === 'main'
              ? 'Enter the text that will be injected as a system event...'
              : 'Enter the message that will trigger an agent turn...'
          }
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={4}
          required
          helperText={
            sessionTarget === 'main'
              ? 'This text will be sent to the main session as a system event'
              : 'This message will run in an isolated session with its own context'
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Schedule Type"
            options={scheduleTypeOptions}
            value={scheduleKind}
            onChange={(e) => setScheduleKind(e.target.value as ScheduleKind)}
          />

          {scheduleKind === 'cron' && (
            <Input
              label="Cron Expression"
              placeholder="0 9 * * *"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              helperText="Example: '0 9 * * *' = daily at 9 AM"
              required
            />
          )}

          {scheduleKind === 'every' && (
            <Select
              label="Interval"
              options={commonIntervals}
              value={intervalMs}
              onChange={(e) => {
                setIntervalMs(e.target.value);
                setCustomIntervalMs('');
              }}
            />
          )}

          {scheduleKind === 'at' && (
            <Input
              label="Run At"
              type="datetime-local"
              value={atDateTime}
              onChange={(e) => setAtDateTime(e.target.value)}
              required
            />
          )}
        </div>

        {scheduleKind === 'cron' && (
          <Input
            label="Timezone (optional)"
            placeholder="America/New_York"
            value={cronTz}
            onChange={(e) => setCronTz(e.target.value)}
            helperText="Leave blank for system default"
          />
        )}

        {scheduleKind === 'every' && (
          <Input
            label="Custom Interval (ms)"
            type="number"
            placeholder="Custom interval in milliseconds"
            value={customIntervalMs}
            onChange={(e) => setCustomIntervalMs(e.target.value)}
            helperText="Override the preset interval with a custom value"
          />
        )}

        {/* Advanced options for isolated sessions */}
        {sessionTarget === 'isolated' && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300">Advanced Options</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Model (optional)"
                placeholder="e.g., opus, gpt"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                helperText="Override the default model"
              />
              <Select
                label="Thinking Level"
                options={[
                  { value: '', label: 'Default' },
                  { value: 'off', label: 'Off' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                value={thinking}
                onChange={(e) => setThinking(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deliverResult}
                  onChange={(e) => setDeliverResult(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">Deliver result to a channel</span>
              </label>

              {deliverResult && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <Input
                    label="Channel"
                    placeholder="e.g., discord, telegram"
                    value={deliverChannel}
                    onChange={(e) => setDeliverChannel(e.target.value)}
                  />
                  <Input
                    label="Target"
                    placeholder="e.g., channel ID or user"
                    value={deliverTo}
                    onChange={(e) => setDeliverTo(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            disabled={!isValid}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
