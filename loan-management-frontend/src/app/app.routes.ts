import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardRedirectComponent } from './pages/dashboard-redirect.component';
import { NotificationComponent } from './pages/notification/notification.component';
import { RepaymentComponent } from './pages/repayment/repayment.component';

// Dashboards
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { UserManagementComponent } from './pages/admin/user-management/user-management.component';
import { AddUserComponent } from './pages/admin/add-user/add-user.component';
import { EditUserComponent } from './pages/admin/edit-user/edit-user.component';
import { LoanTypesComponent } from './pages/admin/loan-types/loan-types.component';
import { ReportsComponent as AdminReportsComponent } from './pages/admin/reports/reports.component';
import { BanksComponent } from './pages/admin/banks/banks.component';
import { TransactionsComponent } from './pages/admin/transactions/transactions.component';

import { CustomerDashboardComponent } from './pages/customer/dashboard/dashboard.component';
import { ApplyLoanComponent } from './pages/customer/apply-loan/apply-loan.component';
import { ApplicationsComponent as CustomerApplicationsComponent } from './pages/customer/applications/applications.component';
import { YourAccountsComponent } from './pages/customer/your-accounts/your-accounts.component';
import { CustomerTransactionsComponent } from './pages/customer/transactions/transactions.component';

import { LoanOfficerDashboardComponent } from './pages/loan-officer/dashboard/dashboard.component';
import { ReviewApplicationsComponent } from './pages/loan-officer/review-applications/review-applications.component';

import { ManagerDashboardComponent } from './pages/manager/dashboard/dashboard.component';
import { ApprovalsComponent } from './pages/manager/approvals/approvals.component';

export const routes: Routes = [
  // Public Routes
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Role Redirect Route
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardRedirectComponent
  },

  // Dashboard layout routes (Authenticated)
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationComponent },
      { path: 'repayments', component: RepaymentComponent },
      
      // Admin Routes
      { 
        path: 'admin/dashboard', 
        component: AdminDashboardComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/users', 
        component: UserManagementComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/users/add', 
        component: AddUserComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/users/edit/:id', 
        component: EditUserComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/loan-types', 
        component: LoanTypesComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/reports', 
        component: AdminReportsComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN', 'MANAGER'] } 
      },
      { 
        path: 'admin/banks', 
        component: BanksComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN'] } 
      },
      { 
        path: 'admin/transactions', 
        component: TransactionsComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['ADMIN', 'MANAGER', 'LOAN_OFFICER'] } 
      },

      // Customer Routes
      { 
        path: 'customer/dashboard', 
        component: CustomerDashboardComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['CUSTOMER'] } 
      },
      { 
        path: 'customer/apply-loan', 
        component: ApplyLoanComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['CUSTOMER'] } 
      },
      { 
        path: 'customer/applications', 
        component: CustomerApplicationsComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['CUSTOMER'] } 
      },
      {
        path: 'customer/your-accounts',
        component: YourAccountsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CUSTOMER'] }
      },
      {
        path: 'customer/transactions',
        component: CustomerTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CUSTOMER'] }
      },

      // Loan Officer Routes
      { 
        path: 'loan-officer/dashboard', 
        component: LoanOfficerDashboardComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['LOAN_OFFICER'] } 
      },
      { 
        path: 'loan-officer/review', 
        component: ReviewApplicationsComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['LOAN_OFFICER'] } 
      },

      // Manager Routes
      { 
        path: 'manager/dashboard', 
        component: ManagerDashboardComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['MANAGER'] } 
      },
      { 
        path: 'manager/approvals', 
        component: ApprovalsComponent, 
        canActivate: [roleGuard], 
        data: { roles: ['MANAGER'] } 
      }
    ]
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];
