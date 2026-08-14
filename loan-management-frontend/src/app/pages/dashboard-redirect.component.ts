import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  template: '<p>Redirecting...</p>'
})
export class DashboardRedirectComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      const rolePath = user.role.toLowerCase().replace('_', '-');
      this.router.navigate([`/${rolePath}/dashboard`]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
