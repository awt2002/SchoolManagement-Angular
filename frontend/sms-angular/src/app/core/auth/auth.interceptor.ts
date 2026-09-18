import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password');

  const authed = isApiCall && tokenService.token()
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${tokenService.token()}` },
        withCredentials: true
      })
    : req.clone({ withCredentials: isApiCall });

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthEndpoint || !isApiCall) {
        return throwError(() => err);
      }

      return from(authService.tryRefresh()).pipe(
        switchMap(ok => {
          if (!ok) {
            tokenService.clear();
            router.navigate(['/login']);
            return throwError(() => err);
          }
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${tokenService.token()}` },
            withCredentials: true
          });
          return next(retried);
        })
      );
    })
  );
};
