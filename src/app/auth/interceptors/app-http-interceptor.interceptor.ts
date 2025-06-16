import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const appHttpInterceptorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Inject AuthService to get access to the token and logout functionality
  const authService = inject(AuthService);

  // Get the authentication token
  const authToken = authService.getToken();

  if(!req.url.includes("/auth/login") )
  {
    // Check if a token exists and if it's valid
    if (authToken && authService.isTokenValid()) {
      // If a token exists and is valid, clone the request and add the Authorization header
      const clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      });
      // Pass the cloned request to the next handler and catch errors
      return next(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          // If the server responds with 401 Unauthorized or 403 Forbidden, it might mean the token is
          // invalid on the server side, or the user doesn't have permission.
          // In such cases, log out the user.
          if (error.status === 401 || error.status === 403) {
            console.warn('Unauthorized or Forbidden response received. Logging out...');
            authService.logout().subscribe(() => {});
          }

          return throwError(() => error);
        })
      );
    } else {
      // If no token exists or the token is invalid, log out the user
      console.warn('No token found or token is invalid. Logging out...');
      authService.logout().subscribe(() => {

      });

      return throwError(() => new Error('Authentication required or token invalid. User logged out.'));
    }
  } else  return next(req)

};
