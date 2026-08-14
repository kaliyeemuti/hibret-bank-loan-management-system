import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-card">
        <div class="card-header">
            <h3>{{ title }}</h3>
            <span *ngIf="icon" class="card-icon">{{ icon }}</span>
        </div>
        <div class="card-value">{{ value }}</div>
        <div *ngIf="trend" class="card-trend">{{ trend }}</div>
    </div>
  `
})
export class DashboardCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = '';
  @Input() trend = '';
}
