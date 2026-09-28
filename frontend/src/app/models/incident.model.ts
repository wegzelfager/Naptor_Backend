/**
 * Naptor Signal - Incidents & Uptime Tracking Models
 * Angular Frontend Layer
 */

export type IncidentStatus = 'OPEN' | 'RESOLVED';

export interface Incident {
  _id: string;
  monitor: string;
  status: IncidentStatus;
  cause: string;
  startedAt: string;
  resolvedAt?: string;
  duration: number; // in seconds
  createdAt: string;
  updatedAt?: string;
}

export interface IncidentsPagination {
  total: number;
  page: number;
  pages: number;
}

export interface IncidentsPaginatedResponse {
  success: boolean;
  message?: string;
  data: Incident[];
  pagination: IncidentsPagination;
  uptimePercentage?: number;
  totalIncidents?: number;
}

export interface UptimeStats {
  '24h': number; // e.g. 99.95
  '7d': number;  // e.g. 98.50
  '30d': number; // e.g. 94.20
}

export interface UptimeResponse {
  success: boolean;
  message?: string;
  data: UptimeStats;
}

export type UptimeHealthLevel = 'optimal' | 'warning' | 'critical';

export interface IncidentQueryParams {
  page?: number;
  limit?: number;
}
