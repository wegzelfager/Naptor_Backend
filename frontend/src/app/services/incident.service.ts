import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IncidentsPaginatedResponse,
  UptimeResponse
} from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly http = inject(HttpClient);

  /**
   * Base API endpoint for monitor endpoints.
   * Can be overridden by an environment configuration or injection token.
   */
  private readonly baseUrl = '/api/v1/monitors';

  /**
   * Fetch paginated incidents for a specific monitor.
   * Endpoint: GET /api/v1/monitors/:monitorId/incidents?page=1&limit=10
   *
   * @param monitorId ID of the monitor
   * @param page Page index (1-based)
   * @param limit Number of incidents per page
   * @returns Observable of IncidentsPaginatedResponse
   */
  getIncidents(
    monitorId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<IncidentsPaginatedResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    const url = `${this.baseUrl}/${encodeURIComponent(monitorId)}/incidents`;

    return this.http
      .get<IncidentsPaginatedResponse>(url, { params })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.handleError('Failed to fetch monitor incidents', error)
        )
      );
  }

  /**
   * Fetch uptime statistics (24h, 7d, 30d) for a specific monitor.
   * Endpoint: GET /api/v1/monitors/:monitorId/uptime
   *
   * @param monitorId ID of the monitor
   * @returns Observable of UptimeResponse
   */
  getUptimeStats(monitorId: string): Observable<UptimeResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(monitorId)}/uptime`;

    return this.http
      .get<UptimeResponse>(url)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.handleError('Failed to fetch monitor uptime stats', error)
        )
      );
  }

  /**
   * Centralized HTTP error handler.
   */
  private handleError(contextMessage: string, error: HttpErrorResponse): Observable<never> {
    let clientMessage = contextMessage;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      clientMessage = `${contextMessage}: ${error.error.message}`;
    } else if (error.error?.message) {
      // Backend returned custom error payload
      clientMessage = error.error.message;
    } else if (error.status === 0) {
      clientMessage = `${contextMessage}: Server unreachable. Check your network or CORS settings.`;
    } else {
      clientMessage = `${contextMessage} (HTTP ${error.status}: ${error.statusText || 'Unknown Error'})`;
    }

    console.error(`[IncidentService Error]:`, {
      context: contextMessage,
      status: error.status,
      message: clientMessage,
      rawError: error
    });

    return throwError(() => new Error(clientMessage));
  }
}
