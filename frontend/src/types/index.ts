// Types for Scuttlebox

export interface AgentStatus {
  busy: boolean;
  current_session: string | null;
  last_activity: string | null;
  active_sessions: number;
}

export interface GatewayHealth {
  ok: boolean;
  uptime_seconds: number | null;
  channels: Record<string, unknown>;
}

export interface Session {
  key: string;
  sessionId: string;
  updatedAt: number | null;
  channel: string | null;
  displayName: string | null;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
}

export interface FileContent {
  path: string;
  content: string;
  exists: boolean;
}

export interface FileListItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: string | null;
}

export interface MemoryEntry {
  path: string;
  name: string;
  date: string | null;
  preview: string | null;
  size: number;
}

export interface CommandResponse {
  ok: boolean;
  response: string | null;
  error: string | null;
}

export interface ConfigResponse {
  config: Record<string, unknown>;
  hash: string;
}

// --- Cron/Task types ---

export type ScheduleKind = 'at' | 'every' | 'cron';
export type SessionTarget = 'main' | 'isolated';
export type PayloadKind = 'systemEvent' | 'agentTurn';

export interface ScheduleAt {
  kind: 'at';
  atMs: number;
}

export interface ScheduleEvery {
  kind: 'every';
  everyMs: number;
  anchorMs?: number;
}

export interface ScheduleCron {
  kind: 'cron';
  expr: string;
  tz?: string;
}

export type Schedule = ScheduleAt | ScheduleEvery | ScheduleCron;

export interface PayloadSystemEvent {
  kind: 'systemEvent';
  text: string;
}

export interface PayloadAgentTurn {
  kind: 'agentTurn';
  message: string;
  model?: string;
  thinking?: string;
  timeoutSeconds?: number;
  deliver?: boolean;
  channel?: string;
  to?: string;
}

export type Payload = PayloadSystemEvent | PayloadAgentTurn;

export interface CronJob {
  id: string;
  jobId?: string;
  name?: string;
  schedule: Schedule;
  payload: Payload;
  sessionTarget: SessionTarget;
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
  lastRunAt?: number;
  nextRunAt?: number;
  runCount?: number;
}

export interface CronJobsResponse {
  jobs: CronJob[];
}

export interface CreateJobRequest {
  name?: string;
  schedule: Schedule;
  payload: Payload;
  sessionTarget: SessionTarget;
  enabled?: boolean;
}
