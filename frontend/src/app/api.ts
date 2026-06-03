// ─── Types ────────────────────────────────────────────────────────────────────

export type PrescriptionStatus = 'PENDING' | 'DELIVERED';

export interface Prescription {
  id: number;
  medicationName: string;
  doctor: string;
  doctorName?: string;
  date: string;
  status: PrescriptionStatus;
  daysRemaining?: number;
  address?: string;
  phone?: string;
  note?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  address?: string;
  prescriptions?: Prescription[];
}

export interface Order {
  id: number;
  prescriptionId?: number;
  address: string;
  phone: string;
  note?: string;
  createdAt: string;
  step: number;
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PrescriptionStats {
  total: number;
  delivered: number;
  pending: number;
  urgentCount: number;
  avgDaysRemaining: number | null;
  byDoctor: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  timestamp: string;
  roomId: string;
}

export interface ActionLog {
  id: number;
  userId: number;
  username: string;
  groupId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface SuspiciousUser {
  id: number;
  username: string;
  email: string;
  suspicious: boolean;
  suspiciousReason: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const API_BASE = 'https://pharmaconnect-production-e92d.up.railway.app';
// ─── Token helper ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  const saved = localStorage.getItem('auth');
  if (!saved) return null;
  try { return JSON.parse(saved).token; } catch { return null; }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
    ...options,
  });

  // Assignment 4 Bronze: sliding-window session — update stored token if server refreshed it
  const refreshedToken = res.headers.get('X-Refreshed-Token');
  if (refreshedToken && (window as any).__updateAuthToken) {
    (window as any).__updateAuthToken(refreshedToken);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─── Offline sync queue ───────────────────────────────────────────────────────

export interface SyncOperation {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  timestamp: number;
}

const syncQueue: SyncOperation[] = [];
export function getSyncQueue() { return [...syncQueue]; }
export function clearSyncQueue() { syncQueue.length = 0; }

function enqueue(op: Omit<SyncOperation, 'id' | 'timestamp'>) {
  syncQueue.push({ ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now() });
}

export async function checkServerReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

export async function replaySyncQueue(): Promise<{ replayed: number; failed: number }> {
  const ops = [...syncQueue];
  syncQueue.length = 0;
  let replayed = 0, failed = 0;
  for (const op of ops) {
    try {
      await apiFetch(op.url.replace(API_BASE, ''), { method: op.method, body: op.body ? JSON.stringify(op.body) : undefined });
      replayed++;
    } catch { failed++; syncQueue.push(op); }
  }
  return { replayed, failed };
}

// ─── Prescription API ─────────────────────────────────────────────────────────

export const prescriptionApi = {
  getAll: (params: { page?: number; pageSize?: number; status?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page)     q.set('page',     String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.status)   q.set('status',   params.status);
    if (params.search)   q.set('search',   params.search);
    return apiFetch<PagedResponse<Prescription>>(`/prescriptions?${q}`);
  },
  getById:  (id: number) => apiFetch<Prescription>(`/prescriptions/${id}`),
  getStats: ()           => apiFetch<PrescriptionStats>('/prescriptions/stats'),

  create: async (data: { medicationName: string; date: string; status: PrescriptionStatus; daysRemaining?: number; note?: string; doctorId: number }) => {
    if (!await checkServerReachable()) {
      enqueue({ method: 'POST', url: '/prescriptions', body: data });
      return { ...data, id: Date.now(), doctor: '' } as unknown as Prescription;
    }
    return apiFetch<Prescription>('/prescriptions', { method: 'POST', body: JSON.stringify(data) });
  },

  update: (id: number, data: unknown) =>
    apiFetch<Prescription>(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  patch: (id: number, data: unknown) =>
    apiFetch<Prescription>(`/prescriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: async (id: number) => {
    if (!await checkServerReachable()) { enqueue({ method: 'DELETE', url: `/prescriptions/${id}` }); return; }
    return apiFetch<void>(`/prescriptions/${id}`, { method: 'DELETE' });
  },

  deleteBulk: (ids: number[]) =>
    apiFetch<{ deleted: number }>('/prescriptions', { method: 'DELETE', body: JSON.stringify({ ids }) }),
};

// ─── Doctor API ───────────────────────────────────────────────────────────────

export const doctorApi = {
  getAll: (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page)     q.set('page',     String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.search)   q.set('search',   params.search);
    return apiFetch<PagedResponse<Doctor>>(`/doctors?${q}`);
  },
  getById:          (id: number)           => apiFetch<Doctor>(`/doctors/${id}`),
  getPrescriptions: (id: number)           => apiFetch<{ data: Prescription[]; total: number }>(`/doctors/${id}/prescriptions`),
  create:           (data: Omit<Doctor,'id'>) => apiFetch<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  update:           (id: number, data: Omit<Doctor,'id'>) => apiFetch<Doctor>(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:           (id: number)           => apiFetch<void>(`/doctors/${id}`, { method: 'DELETE' }),
};

// ─── Order API ────────────────────────────────────────────────────────────────

export const orderApi = {
  getAll:     (params = {}) => apiFetch<PagedResponse<Order>>(`/orders?${new URLSearchParams(params as Record<string,string>)}`),
  getById:    (id: number)  => apiFetch<Order>(`/orders/${id}`),
  getStats:   ()            => apiFetch<Record<string,unknown>>('/orders/stats'),
  create:     (data: unknown) => apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (id: number, step: number) => apiFetch<Order>(`/orders/${id}/step`, { method: 'PATCH', body: JSON.stringify({ step }) }),
  delete:     (id: number)  => apiFetch<void>(`/orders/${id}`, { method: 'DELETE' }),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

export const chatApi = {
  getHistory: (roomId: string) => apiFetch<ChatMessage[]>(`/chat/${roomId}/history`),
};

// ─── Admin API (Gold) ─────────────────────────────────────────────────────────

export const adminApi = {
  getLogs:          (page = 0, size = 20)  => apiFetch<{ data: ActionLog[]; total: number; totalPages: number }>(`/admin/logs?page=${page}&size=${size}`),
  getSuspicious:    ()                     => apiFetch<SuspiciousUser[]>('/admin/suspicious'),
  clearSuspicious:  (userId: number)       => apiFetch<unknown>(`/admin/suspicious/${userId}`, { method: 'DELETE' }),
  getLogsByUser:    (userId: number)       => apiFetch<ActionLog[]>(`/admin/logs/user/${userId}`),
};

// ─── GraphQL ──────────────────────────────────────────────────────────────────

export async function graphql<T = unknown>(query: string, variables?: Record<string,unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Generator API (Silver) ───────────────────────────────────────────────────

export const generatorApi = {
  start: (intervalSeconds = 3, batchSize = 2) =>
    apiFetch<Record<string, unknown>>('/generator/start', {
      method: 'POST',
      body: JSON.stringify({ intervalSeconds, batchSize }),
    }),
  stop: () =>
    apiFetch<Record<string, unknown>>('/generator/stop', { method: 'POST' }),
  status: () =>
    apiFetch<{ running: boolean }>('/generator/status'),
};
