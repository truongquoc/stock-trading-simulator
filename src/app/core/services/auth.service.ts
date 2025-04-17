import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();
  private isBrowser: boolean;
  
  constructor(private http: HttpClient) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (this.isBrowser) {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson && !this.jwtHelper.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // In a real app, this would be an API call
    // For simulation purposes, we'll create a mock response
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        firstName: 'Demo',
        lastName: 'User',
        cashBalance: 100000, // Start with $100,000
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const response: AuthResponse = {
        user: mockUser,
        token: mockToken
      };

      this.setSession(response);
      return of(response);
    }
    
    return throwError(() => new Error('Invalid credentials'));
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // In a real app, this would be an API call
    // For simulation purposes, we'll create a mock response
    const mockUser: User = {
      id: '1',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      cashBalance: 100000, // Start with $100,000
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const response: AuthResponse = {
      user: mockUser,
      token: mockToken
    };

    this.setSession(response);
    return of(response);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setSession(authResult: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('token', authResult.token);
      localStorage.setItem('user', JSON.stringify(authResult.user));
    }
    this.currentUserSubject.next(authResult.user);
  }

  updateUserBalance(newBalance: number): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        cashBalance: newBalance,
        updatedAt: new Date()
      };
      if (this.isBrowser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      this.currentUserSubject.next(updatedUser);
    }
  }
}
