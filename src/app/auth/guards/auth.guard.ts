
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        console.warn('AuthGuard: User not authenticated. Redirecting to login.');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      }
    })

  );
};
