import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';
import { UserRole } from '../models/user-role.model';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};

export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return () => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    if (!tokenService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const role = tokenService.role();
    if (role && allowed.includes(role)) return true;

    router.navigate(['/unauthorized']);
    return false;
  };
}
