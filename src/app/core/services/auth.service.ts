import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioSession } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<UsuarioSession | null>(this.readSession());
  readonly currentUser = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly loading = signal(false);

  login(email: string, contrasena: string) {
    this.loading.set(true);
    return this.http
      .post<UsuarioSession>(`${environment.apiUrl}/auth/login`, { email, contrasena })
      .pipe(
        tap((user) => {
          this.session.set(user);
          localStorage.setItem('incheky-session', JSON.stringify(user));
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  logout() {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.session.set(null);
        localStorage.removeItem('incheky-session');
        void this.router.navigate(['/login']);
      }),
    );
  }

  hasRole(...roles: string[]) {
    return !!this.session() && roles.includes(this.session()!.rol);
  }

  private readSession(): UsuarioSession | null {
    try {
      const value = localStorage.getItem('incheky-session');
      return value ? (JSON.parse(value) as UsuarioSession) : null;
    } catch {
      return null;
    }
  }
}
