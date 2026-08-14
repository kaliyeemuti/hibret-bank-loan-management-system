import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  const user = authService.currentUser();

  if (user && expectedRoles && expectedRoles.includes(user.role)) {
    return true;
  }

  if (user) {
    const dashboardPath = `/${user.role.toLowerCase().replace('_', '-')}/dashboard`;
    router.navigate([dashboardPath]);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
