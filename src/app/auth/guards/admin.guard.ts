import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Role } from '../enum/Role';
import { map, tap } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    // Ensure the user is authenticated first
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        console.warn('AdminGuard: User not authenticated. Redirecting to login.');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      }
    }),
    // Then check for the admin role
    map(isAuthenticated => {
      if (isAuthenticated) {
        const hasAdminRole = authService.hasRole(Role.ADMIN);
        if (!hasAdminRole) {
          console.warn('AdminGuard: User authenticated but does not have ADMIN role. Redirecting to unauthorized.');
          router.navigate(['/unauthorized']); // Or a dashboard page, depending on your app flow
        }
        return hasAdminRole;
      }
      return false; // Not authenticated, so cannot be admin
    })
  );
};
