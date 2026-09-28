import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { IncidentService } from '../../services/incident.service';
import {
  Incident,
  IncidentsPagination,
  UptimeStats
} from '../../models/incident.model';
import { UptimeBadgeComponent } from '../uptime-badge/uptime-badge.component';
import { IncidentHistoryTableComponent } from '../incident-history-table/incident-history-table.component';

@Component({
  selector: 'app-monitor-details',
  standalone: true,
  imports: [CommonModule, UptimeBadgeComponent, IncidentHistoryTableComponent],
  template: `
    <div class="monitor-details-container">
      <!-- Top Navigation & Actions Bar -->
      <div class="top-bar">
        <div class="monitor-identity">
          <div class="status-indicator-badge" [ngClass]="currentHealthClass()">
            <span class="pulse-dot"></span>
            <span>{{ liveStatus() }}</span>
          </div>
          <div class="monitor-meta">
            <h1 class="monitor-title">{{ monitorName() }}</h1>
            <a *ngIf="monitorUrl()" [href]="monitorUrl()" target="_blank" rel="noopener noreferrer" class="monitor-url">
              <span>{{ monitorUrl() }}</span>
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div class="top-actions">
          <button (click)="refreshAll()" [disabled]="isRefreshing()" class="btn-refresh">
            <svg class="h-4 w-4" [class.animate-spin]="isRefreshing()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isRefreshing() ? 'Refreshing...' : 'Live Refresh' }}</span>
          </button>
        </div>
      </div>

      <!-- Section 1: Uptime Badges & Availability Metrics -->
      <section class="section-block">
        <app-uptime-badge
          [stats]="uptimeStats()"
          [isLoading]="isUptimeLoading()"
          [lastUpdated]="lastUpdated()">
        </app-uptime-badge>
      </section>

      <!-- Section 2: Incident History Table -->
      <section class="section-block">
        <app-incident-history-table
          [incidents]="incidents()"
          [pagination]="pagination()"
          [isLoading]="isIncidentsLoading()"
          [errorMessage]="incidentsError()"
          (pageChange)="onPageChange($event)"
          (refresh)="loadIncidents()">
        </app-incident-history-table>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #0b0f19;
      color: #e2e8f0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .monitor-details-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .monitor-identity {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-indicator-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .status-indicator-badge.status-up {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .status-indicator-badge.status-down {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .status-indicator-badge.status-paused {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #cbd5e1;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-up .pulse-dot {
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    .status-down .pulse-dot {
      box-shadow: 0 0 10px #ef4444;
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
    }

    .monitor-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .monitor-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }

    .monitor-url {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.82rem;
      color: #60a5fa;
      text-decoration: none;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .monitor-url:hover {
      text-decoration: underline;
    }

    .btn-refresh {
      background: #1e293b;
      border: 1px solid #334155;
      color: #f1f5f9;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-refresh:hover:not(:disabled) {
      background: #334155;
      border-color: #475569;
    }
    .btn-refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .section-block {
      width: 100%;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class MonitorDetailsComponent implements OnInit, OnChanges {
  private readonly incidentService = inject(IncidentService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Monitor ID can be passed directly as an input (for embedding inside tabs/drawers)
   * or parsed automatically from the activated route parameters.
   */
  @Input() monitorId: string = '';
  @Input() monitorNameInput: string = 'Production API Monitor';
  @Input() monitorUrlInput: string = 'https://api.naptorsignal.com/health';

  // Signals for Reactive State Management
  readonly uptimeStats = signal<UptimeStats | null>(null);
  readonly incidents = signal<Incident[]>([]);
  readonly pagination = signal<IncidentsPagination | null>(null);

  readonly isUptimeLoading = signal<boolean>(false);
  readonly isIncidentsLoading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly incidentsError = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly monitorName = signal<string>('Production API Monitor');
  readonly monitorUrl = signal<string>('https://api.naptorsignal.com/health');
  readonly liveStatus = signal<'UP' | 'DOWN' | 'PAUSED'>('UP');

  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    if (!this.monitorId) {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          const id = params.get('monitorId') || params.get('id');
          if (id) {
            this.monitorId = id;
            this.loadAllData();
          }
        });
    } else {
      this.loadAllData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['monitorNameInput']) {
      this.monitorName.set(this.monitorNameInput);
    }
    if (changes['monitorUrlInput']) {
      this.monitorUrl.set(this.monitorUrlInput);
    }
    if (changes['monitorId'] && !changes['monitorId'].firstChange && this.monitorId) {
      this.currentPage = 1;
      this.loadAllData();
    }
  }

  loadAllData(): void {
    if (!this.monitorId) return;

    this.isUptimeLoading.set(true);
    this.isIncidentsLoading.set(true);
    this.incidentsError.set(null);

    forkJoin({
      uptime: this.incidentService.getUptimeStats(this.monitorId),
      incidents: this.incidentService.getIncidents(this.monitorId, this.currentPage, this.pageSize)
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isUptimeLoading.set(false);
          this.isIncidentsLoading.set(false);
          this.isRefreshing.set(false);
          this.lastUpdated.set(new Date());
        })
      )
      .subscribe({
        next: ({ uptime, incidents }) => {
          if (uptime?.data) {
            this.uptimeStats.set(uptime.data);
          }
          if (incidents?.data) {
            this.incidents.set(incidents.data);
            this.pagination.set(incidents.pagination);

            // Determine liveStatus from any open incidents
            const hasOpenIncident = incidents.data.some(i => i.status === 'OPEN');
            this.liveStatus.set(hasOpenIncident ? 'DOWN' : 'UP');
          }
        },
        error: (err: Error) => {
          this.incidentsError.set(err.message || 'Failed to retrieve monitor telemetry');
        }
      });
  }

  loadIncidents(): void {
    if (!this.monitorId) return;

    this.isIncidentsLoading.set(true);
    this.incidentsError.set(null);

    this.incidentService
      .getIncidents(this.monitorId, this.currentPage, this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isIncidentsLoading.set(false))
      )
      .subscribe({
        next: response => {
          this.incidents.set(response.data || []);
          this.pagination.set(response.pagination);
          const hasOpenIncident = (response.data || []).some(i => i.status === 'OPEN');
          this.liveStatus.set(hasOpenIncident ? 'DOWN' : 'UP');
        },
        error: (err: Error) => {
          this.incidentsError.set(err.message || 'Failed to reload incident logs');
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadIncidents();
  }

  refreshAll(): void {
    this.isRefreshing.set(true);
    this.loadAllData();
  }

  currentHealthClass(): string {
    const status = this.liveStatus();
    switch (status) {
      case 'UP': return 'status-up';
      case 'DOWN': return 'status-down';
      default: return 'status-paused';
    }
  }
}
