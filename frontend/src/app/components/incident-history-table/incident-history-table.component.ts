import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Incident, IncidentsPagination } from '../../models/incident.model';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-incident-history-table',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  template: `
    <div class="incident-table-card">
      <!-- Card Header -->
      <div class="card-header">
        <div class="header-title">
          <div class="icon-wrapper">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="title">Incident History</h3>
            <p class="subtitle">Timeline of downtime events, causes, and resolution times</p>
          </div>
        </div>

        <div class="header-actions">
          <button (click)="refresh.emit()" [disabled]="isLoading" class="btn-secondary" title="Refresh incidents">
            <svg class="h-4 w-4" [class.animate-spin]="isLoading" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Error Banner -->
      <div *ngIf="errorMessage" class="error-banner">
        <span>{{ errorMessage }}</span>
        <button (click)="refresh.emit()" class="btn-link">Try Again</button>
      </div>

      <!-- Table Content -->
      <div class="table-responsive">
        <table class="incident-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Cause / Trigger</th>
              <th>Started At</th>
              <th>Resolved At</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading Skeletons -->
            <tr *ngIf="isLoading && (!incidents || incidents.length === 0)" class="loading-row">
              <td colspan="5">
                <div class="skeleton-lines">
                  <div class="skeleton-row" *ngFor="let i of [1, 2, 3, 4]"></div>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="!isLoading && (!incidents || incidents.length === 0)">
              <td colspan="5" class="empty-state">
                <div class="empty-content">
                  <div class="success-icon-wrap">
                    <svg class="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 class="empty-title">All Systems Operational</h4>
                  <p class="empty-desc">No downtime incidents recorded for this monitor. Looking rock solid!</p>
                </div>
              </td>
            </tr>

            <!-- Incident Rows -->
            <tr *ngFor="let inc of incidents" [class.row-open]="inc.status === 'OPEN'">
              <!-- Status Badge -->
              <td>
                <span class="status-chip" [ngClass]="inc.status === 'OPEN' ? 'chip-open' : 'chip-resolved'">
                  <span class="dot" [class.dot-pulsing]="inc.status === 'OPEN'"></span>
                  {{ inc.status }}
                </span>
              </td>

              <!-- Cause -->
              <td>
                <div class="cause-text" [title]="inc.cause">
                  {{ inc.cause || 'Service Unavailable / Request Failed' }}
                </div>
              </td>

              <!-- Started At -->
              <td>
                <span class="timestamp">{{ inc.startedAt | date:'medium' }}</span>
              </td>

              <!-- Resolved At -->
              <td>
                <span *ngIf="inc.resolvedAt" class="timestamp">{{ inc.resolvedAt | date:'medium' }}</span>
                <span *ngIf="!inc.resolvedAt" class="badge-ongoing">
                  <span class="pulse-ring"></span>
                  Ongoing Incident
                </span>
              </td>

              <!-- Duration -->
              <td>
                <span class="duration-pill" [class.pill-ongoing]="inc.status === 'OPEN'">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span *ngIf="inc.status === 'RESOLVED'">{{ inc.duration | duration }}</span>
                  <span *ngIf="inc.status === 'OPEN'">Ongoing</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div *ngIf="pagination && pagination.total > 0" class="card-footer">
        <div class="pagination-info">
          Showing page <strong>{{ pagination.page }}</strong> of <strong>{{ pagination.pages }}</strong>
          <span class="info-muted">({{ pagination.total }} total incidents)</span>
        </div>

        <div class="pagination-controls">
          <button
            class="btn-page"
            [disabled]="pagination.page <= 1 || isLoading"
            (click)="onPageChange(pagination.page - 1)"
          >
            &larr; Previous
          </button>

          <span class="page-current">{{ pagination.page }}</span>

          <button
            class="btn-page"
            [disabled]="pagination.page >= pagination.pages || isLoading"
            (click)="onPageChange(pagination.page + 1)"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .incident-table-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 14px;
      color: #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .card-header {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      background: rgba(15, 23, 42, 0.6);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .subtitle {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .btn-secondary {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover:not(:disabled) {
      background: #334155;
      color: #fff;
      border-color: #475569;
    }
    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border-bottom: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 10px 24px;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-link {
      background: none;
      border: none;
      color: #fff;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .incident-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    .incident-table th {
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 12px 20px;
      border-bottom: 1px solid #334155;
    }

    .incident-table td {
      padding: 14px 20px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
      color: #cbd5e1;
      vertical-align: middle;
    }

    .incident-table tbody tr:hover {
      background: rgba(30, 41, 59, 0.5);
    }

    .row-open {
      background: rgba(239, 68, 68, 0.05);
    }

    /* Chips */
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .chip-open {
      background: rgba(239, 68, 68, 0.18);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .chip-resolved {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .dot-pulsing {
      animation: pulseDot 1.5s infinite;
    }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.6); opacity: 0.4; }
    }

    .cause-text {
      font-weight: 500;
      color: #f1f5f9;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .timestamp {
      color: #94a3b8;
      font-size: 0.82rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .badge-ongoing {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #f87171;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .pulse-ring {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }

    .duration-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .duration-pill.pill-ongoing {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    /* Empty state */
    .empty-state {
      padding: 48px 20px !important;
      text-align: center;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .success-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .empty-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .empty-desc {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      max-width: 380px;
    }

    /* Pagination */
    .card-footer {
      padding: 14px 24px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pagination-info {
      font-size: 0.83rem;
      color: #94a3b8;
    }

    .pagination-info strong {
      color: #f1f5f9;
    }

    .info-muted {
      margin-left: 6px;
      color: #64748b;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-page {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-page:hover:not(:disabled) {
      background: #334155;
      color: #fff;
    }
    .btn-page:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-current {
      background: #3b82f6;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
    }

    /* Skeleton Loading */
    .skeleton-lines {
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .skeleton-row {
      height: 24px;
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
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
export class IncidentHistoryTableComponent {
  @Input() incidents: Incident[] = [];
  @Input() pagination: IncidentsPagination | null = null;
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string | null = null;

  @Output() pageChange = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();

  onPageChange(newPage: number): void {
    if (this.pagination && newPage >= 1 && newPage <= this.pagination.pages) {
      this.pageChange.emit(newPage);
    }
  }
}
