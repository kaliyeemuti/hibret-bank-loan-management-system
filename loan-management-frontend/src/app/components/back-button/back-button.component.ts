import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="goBack()" class="back-button">
      ← Back
    </button>
  `,
  styles: `
    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background-color: white;
      color: var(--primary-purple);
      border: 1px solid var(--primary-purple);
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 20px;
    }

    .back-button:hover {
      background-color: var(--primary-purple);
      color: white;
    }
  `
})
export class BackButtonComponent {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
