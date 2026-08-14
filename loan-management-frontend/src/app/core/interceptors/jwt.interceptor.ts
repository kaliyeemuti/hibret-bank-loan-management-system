import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Attach JWT token to every outgoing request
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error) => {
      // Re-throw all errors so each component's own error handler can deal
      // with them. Do NOT call logout() or navigate() here — background
      // requests (notification polling, etc.) returning 401 must never tear
      // down the current page.
      return throwError(() => error);
    })
  );
};
