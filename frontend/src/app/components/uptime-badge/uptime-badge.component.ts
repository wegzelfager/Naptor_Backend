import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UptimeStats, UptimeHealthLevel } from '../../models/incident.model';

interface UptimePeriodCard {
  key: keyof UptimeStats;
  label: string;
  subtext: string;
  value: number;
  level: UptimeHealthLevel;
  cssClass: string;
}

@Component({
  selector: 'app-uptime-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="uptime-badge-container">
      <div class="header-row">
        <div class="title-group">
          <span class="pulse-indicator" [class.pulse-active]="hasData()"></span>
          <h4 class="title">System Availability & Uptime</h4>
        </div>
        <span class="refresh-badge" *ngIf="lastUpdated">Updated {{ lastUpdated | date:'shortTime' }}</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="cards-grid skeleton-grid">
        <div class="period-card skeleton-card" *ngFor="let i of [1, 2, 3]">
          <div class="skeleton-line sm"></div>
          <div class="skeleton-line lg"></div>
        </div>
      </div>

      <!-- Cards Grid -->
      <div *ngIf="!isLoading" class="cards-grid">
        <div
          *ngFor="let period of periods()"
          class="period-card"
          [ngClass]="period.cssClass"
          [attr.data-health]="period.level"
        >
          <div class="card-header">
            <span class="period-label">{{ period.label }}</span>
            <span class="status-dot" [ngClass]="period.level"></span>
          </div>

          <div class="metric-value-wrap">
            <span class="metric-value">
              {{ period.value !== undefined ? (period.value | number:'1.2-2') + '%' : 'N/A' }}
            </span>
          </div>

          <div class="card-footer">
            <span class="status-badge" [ngClass]="period.level">
              {{ getStatusLabel(period.level) }}
            </span>
            <span class="subtext">{{ period.subtext }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .uptime-badge-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px;
      color: #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pulse-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #64748b;
      display: inline-block;
      transition: background-color 0.3s ease;
    }

    .pulse-indicator.pulse-active {
      background-color: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
      animation: pulseGlow 2s infinite;
    }

    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #f1f5f9;
      text-transform: uppercase;
    }

    .refresh-badge {
      font-size: 0.75rem;
      color: #94a3b8;
      background: #1e293b;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }

    .period-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .period-card:hover {
      transform: translateY(-2px);
    }

    /* Optimal (> 99%) */
    .period-card.card-optimal {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, #1e293b 100%);
      border-color: rgba(16, 185, 129, 0.35);
    }
    .period-card.card-optimal:hover {
      border-color: #10b981;
      box-shadow: 0 6px 20px -4px rgba(16, 185, 129, 0.25);
    }
    .metric-value-wrap .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .card-optimal .metric-value {
      color: #34d399;
      text-shadow: 0 0 18px rgba(52, 211, 153, 0.3);
    }

    /* Warning (95% - 99%) */
    .period-card.card-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, #1e293b 100%);
      border-color: rgba(245, 158, 11, 0.35);
    }
    .period-card.card-warning:hover {
      border-color: #f59e0b;
      box-shadow: 0 6px 20px -4px rgba(245, 158, 11, 0.25);
    }
    .card-warning .metric-value {
      color: #fbbf24;
      text-shadow: 0 0 18px rgba(251, 191, 36, 0.3);
    }

    /* Critical (< 95%) */
    .period-card.card-critical {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, #1e293b 100%);
      border-color: rgba(239, 68, 68, 0.35);
    }
    .period-card.card-critical:hover {
      border-color: #ef4444;
      box-shadow: 0 6px 20px -4px rgba(239, 68, 68, 0.25);
    }
    .card-critical .metric-value {
      color: #f87171;
      text-shadow: 0 0 18px rgba(248, 113, 113, 0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .period-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.optimal { background: #10b981; }
    .status-dot.warning { background: #f59e0b; }
    .status-dot.critical { background: #ef4444; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
      letter-spacing: 0.03em;
    }
    .status-badge.optimal {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-badge.warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .status-badge.critical {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .subtext {
      font-size: 0.72rem;
      color: #64748b;
    }

    /* Skeleton Loading */
    .skeleton-card {
      background: #1e293b;
      border-color: #334155;
      min-height: 110px;
    }
    .skeleton-line {
      background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-line.sm { width: 45%; height: 12px; }
    .skeleton-line.lg { width: 80%; height: 32px; margin-top: 10px; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class UptimeBadgeComponent {
  private readonly statsSignal = signal<UptimeStats | null>(null);

  @Input()
  set stats(value: UptimeStats | null | undefined) {
    this.statsSignal.set(value || null);
  }
  get stats(): UptimeStats | null {
    return this.statsSignal();
  }

  @Input() isLoading: boolean = false;
  @Input() lastUpdated: Date | string | null = null;

  hasData = computed(() => {
    const s = this.statsSignal();
    return s !== null && s !== undefined;
  });

  periods = computed<UptimePeriodCard[]>(() => {
    const current = this.statsSignal();
    const periodsConfig: Array<{ key: keyof UptimeStats; label: string; subtext: string }> = [
      { key: '24h', label: 'Last 24 Hours', subtext: 'Rolling 1-day' },
      { key: '7d', label: 'Last 7 Days', subtext: 'Rolling 1-week' },
      { key: '30d', label: 'Last 30 Days', subtext: 'Rolling 1-month' }
    ];

    return periodsConfig.map(cfg => {
      const val = current ? current[cfg.key] : 100;
      const level = this.calculateHealthLevel(val);
      return {
        key: cfg.key,
        label: cfg.label,
        subtext: cfg.subtext,
        value: val,
        level,
        cssClass: `card-${level}`
      };
    });
  });

  /**
   * Health status classification:
   *  - Green (> 99%)
   *  - Yellow (95% - 99%)
   *  - Red (< 95%)
   */
  calculateHealthLevel(percentage: number | undefined): UptimeHealthLevel {
    if (percentage === undefined || isNaN(percentage)) return 'optimal';
    if (percentage >= 99) return 'optimal';
    if (percentage >= 95) return 'warning';
    return 'critical';
  }

  getStatusLabel(level: UptimeHealthLevel): string {
    switch (level) {
      case 'optimal':
        return 'Operational';
      case 'warning':
        return 'Degraded';
      case 'critical':
        return 'Outage / Critical';
    }
  }
}
