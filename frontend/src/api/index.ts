import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for figgy-portal backend

// Status
export async function getAgentStatus() {
  const { data } = await api.get('/status');
  return data;
}

export async function getGatewayHealth() {
  const { data } = await api.get('/status/health');
  return data;
}

// Sessions
export async function getSessions(activeMinutes?: number) {
  const params = activeMinutes ? { active_minutes: activeMinutes } : {};
  const { data } = await api.get('/sessions', { params });
  return data;
}

export async function getSessionHistory(sessionKey: string, limit = 50, includeTools = false) {
  const { data } = await api.get(`/sessions/${encodeURIComponent(sessionKey)}/history`, {
    params: { limit, include_tools: includeTools },
  });
  return data;
}

// Commands
export async function sendCommand(message: string, sessionKey?: string) {
  const { data } = await api.post('/command', {
    message,
    session_key: sessionKey,
  });
  return data;
}

// Files
export async function listFiles(path = '') {
  const { data } = await api.get('/files', { params: { path } });
  return data;
}

export async function readFile(path: string) {
  const { data } = await api.get(`/files/read/${encodeURIComponent(path)}`);
  return data;
}

export async function writeFile(path: string, content: string) {
  const { data } = await api.put(`/files/write/${encodeURIComponent(path)}`, { content });
  return data;
}

export async function deleteFile(path: string) {
  const { data } = await api.delete(`/files/delete/${encodeURIComponent(path)}`);
  return data;
}

// Convenience endpoints
export async function getSoul() {
  const { data } = await api.get('/files/soul');
  return data;
}

export async function updateSoul(content: string) {
  const { data } = await api.put('/files/soul', { content });
  return data;
}

export async function getUser() {
  const { data } = await api.get('/files/user');
  return data;
}

export async function updateUser(content: string) {
  const { data } = await api.put('/files/user', { content });
  return data;
}

export async function getAgentsFile() {
  const { data } = await api.get('/files/agents');
  return data;
}

export async function updateAgentsFile(content: string) {
  const { data } = await api.put('/files/agents', { content });
  return data;
}

export async function getMemoryFiles() {
  const { data } = await api.get('/files/memory');
  return data;
}

// Config
export async function getConfig() {
  const { data } = await api.get('/config');
  return data;
}

export async function patchConfig(patch: Record<string, unknown>, baseHash: string) {
  const { data } = await api.patch('/config', { patch, base_hash: baseHash });
  return data;
}

export async function restartGateway() {
  const { data } = await api.post('/config/restart');
  return data;
}

// Logs
export async function getLogs(params: {
  sessionKey?: string;
  channel?: string;
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeTools?: boolean;
} = {}) {
  const { data } = await api.get('/logs', { params: {
    session_key: params.sessionKey,
    channel: params.channel,
    role: params.role,
    search: params.search,
    limit: params.limit,
    offset: params.offset,
    include_tools: params.includeTools,
  }});
  return data;
}

export async function getLogSessions() {
  const { data } = await api.get('/logs/sessions');
  return data;
}

export async function getLogChannels() {
  const { data } = await api.get('/logs/channels');
  return data;
}

// Queue
export async function getQueueStatus() {
  const { data } = await api.get('/queue/status');
  return data;
}

export async function updateQueueConfig(config: {
  mode?: string;
  debounceMs?: number;
  cap?: number;
  drop?: string;
}) {
  const { data } = await api.patch('/queue/config', config);
  return data;
}

// Config Schema
export async function getConfigSchema() {
  const { data } = await api.get('/config/schema');
  return data;
}

// Cron/Tasks
export async function getCronStatus() {
  const { data } = await api.get('/cron/status');
  return data;
}

export async function getCronJobs(includeDisabled = false) {
  const { data } = await api.get('/cron/jobs', {
    params: { include_disabled: includeDisabled },
  });
  return data;
}

export async function createCronJob(job: {
  name?: string;
  schedule: Record<string, unknown>;
  payload: Record<string, unknown>;
  sessionTarget: string;
  enabled?: boolean;
}) {
  const { data } = await api.post('/cron/jobs', job);
  return data;
}

export async function updateCronJob(
  jobId: string,
  patch: {
    name?: string;
    schedule?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    enabled?: boolean;
  }
) {
  const { data } = await api.patch(`/cron/jobs/${encodeURIComponent(jobId)}`, patch);
  return data;
}

export async function deleteCronJob(jobId: string) {
  const { data } = await api.delete(`/cron/jobs/${encodeURIComponent(jobId)}`);
  return data;
}

export async function runCronJob(jobId: string) {
  const { data } = await api.post(`/cron/jobs/${encodeURIComponent(jobId)}/run`);
  return data;
}

export async function pauseCronJob(jobId: string) {
  const { data } = await api.post(`/cron/jobs/${encodeURIComponent(jobId)}/pause`);
  return data;
}

export async function resumeCronJob(jobId: string) {
  const { data } = await api.post(`/cron/jobs/${encodeURIComponent(jobId)}/resume`);
  return data;
}

export async function getCronJobRuns(jobId: string) {
  const { data } = await api.get(`/cron/jobs/${encodeURIComponent(jobId)}/runs`);
  return data;
}

export default api;
