// src/app/auth/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs'; // Import 'of'
import { delay, finalize } from 'rxjs/operators'; // Import operators
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginResponse } from "../dto/LoginResponse";
import { LoginCredentials } from "../dto/LoginCredentials";
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from "../types/DecodedToken";
import { Role } from "../enum/Role";


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = environment.apiUrl;
  private authUrl = `${this.apiUrl}auth`;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();


  private hasToken(): boolean {
    return !!localStorage.getItem("token");
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials)
      .pipe(
        tap((response: LoginResponse) => {
          if (response.accessToken) {
            localStorage.setItem("token", response.accessToken);
            this.isAuthenticatedSubject.next(true);
          } else {
            console.warn("Login successful but 'accessToken' not found in response.");
          }
        })
      );
  }

  getToken(): string | null {
    if (this.hasToken()) {
      return localStorage.getItem("token");
    } else {
      console.log("No token found in localStorage.");
      return null;
    }
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decodedToken.exp > currentTime && this.isAuthenticatedSubject.value;
      } catch (error) {
        console.error("Error decoding token or token expired:", error);
        return false;
      }
    }
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Logs out the user by removing the token and navigating to the login page.
   * Returns an Observable<boolean> to indicate success/failure of the logout process.
   */
  logout(): Observable<boolean> { // Changed return type to Observable<boolean>
    // Simulate an asynchronous operation, even for local storage clearing
    // This allows the NavbarComponent to show loading state and messages
    return of(true).pipe( // 'of(true)' creates an observable that immediately emits 'true'
      delay(500), // Simulate a 500ms delay for demonstration
      tap(() => {
        localStorage.removeItem("token");
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
      }),
      // Optional: add any finalization logic if needed
      finalize(() => console.log('Logout process finished'))
    );
  }

  private decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode<DecodedToken>(token);
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  }

  getUsername(): string | null {
    const decodedToken = this.decodeToken();
    return decodedToken ? decodedToken.sub : null;
  }

  getRoles(): string[] {
    const decodedToken = this.decodeToken();
    if (decodedToken && decodedToken.roles) {
      return decodedToken.roles.split(' ').map(role => role.trim().toUpperCase()); // Ensure consistent casing and trim spaces
    }
    return [];
  }

  /**
   * Checks if the user has a specific role.
   * @param role The Role enum value to check for (e.g., Role.ADMIN).
   * @returns True if the user has the role, false otherwise.
   */
  hasRole(role: Role): boolean {
    const roles = this.getRoles();
    return roles.includes(role);
  }
}
