import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../../core/services/loan.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';

interface LoanProduct {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: string | number;
  tenure: string | number;
  description: string;
}

@Component({
  selector: 'app-loan-types',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  template: `
    <div class="page-wrapper">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div>
          <h1>Loan Types</h1>
          <p>Available loan products</p>
        </div>
      </div>

      <div class="page-content">
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Loan Type</th>
                  <th>Min Amount</th>
                  <th>Max Amount</th>
                  <th>Interest Rate</th>
                  <th>Tenure</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let loanType of loanProducts()">
                  <td><strong>{{ loanType.name }}</strong></td>
                  <td>\${{ loanType.minAmount.toLocaleString() }}</td>
                  <td>\${{ loanType.maxAmount.toLocaleString() }}</td>
                  <td>{{ formatInterest(loanType.interestRate) }}</td>
                  <td>{{ formatTenure(loanType.tenure) }}</td>
                  <td>{{ loanType.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoanTypesComponent implements OnInit {
  loanService = inject(LoanService);

  loanProducts = signal<LoanProduct[]>([]);

  ngOnInit() {
    this.loanService.getLoanProducts().subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          const mapped = products.map((p: any) => ({
            id: p.id,
            name: p.name || p.productName || 'Loan Product',
            minAmount: p.minAmount || p.minimumAmount || 0,
            maxAmount: p.maxAmount || p.maximumAmount || 0,
            interestRate: p.interestRate ?? '',
            tenure: p.repaymentPeriodMonths || p.tenure || '',
            description: p.description || ''
          }));
          this.loanProducts.set(mapped);
        } else {
          this.loanProducts.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading loan products:', err);
        this.loanProducts.set([]);
      }
    });
  }

  formatInterest(rate: any) {
    if (typeof rate === 'number') {
      return `${rate}%`;
    }
    return rate;
  }

  formatTenure(tenure: any) {
    if (typeof tenure === 'number') {
      return `${tenure} months`;
    }
    return tenure;
  }
}
