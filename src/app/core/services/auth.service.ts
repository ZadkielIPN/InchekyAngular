import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioProfile, UsuarioProfileRequest, UsuarioSession } from '../models/api.models';

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
      .post<UsuarioSession>(`${environment.apiUrl}/auth/login`, {
        email: email.trim(),
        contrasena,
      })
      .pipe(
        tap((user) => {
          this.session.set(user);
          localStorage.setItem('incheky-session', JSON.stringify(user));
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  register(data: {
    nombre: string;
    apellido: string;
    email: string;
    contrasena: string;
  }) {
    this.loading.set(true);
    return this.http
      .post<UsuarioSession>(`${environment.apiUrl}/auth/register`, {
        ...data,
        puntos: 0,
        nivelLealtad: 'BRONCE',
      })
      .pipe(
        tap((user) => {
          this.session.set(user);
          localStorage.setItem('incheky-session', JSON.stringify(user));
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  getProfile() {
    return this.http.get<UsuarioProfile>(`${environment.apiUrl}/auth/me`);
  }

  updateProfile(data: UsuarioProfileRequest) {
    return this.http.put<UsuarioProfile>(`${environment.apiUrl}/auth/me`, data).pipe(
      tap((profile) => {
        const current = this.session();
        if (!current) return;
        const updated = { ...current, ...profile };
        this.session.set(updated);
        localStorage.setItem('incheky-session', JSON.stringify(updated));
      }),
    );
  }

  getLoginErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo procesar el inicio de sesión.';
    }

    const serverMessage = this.readServerMessage(error);

    if (serverMessage) {
      return serverMessage;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que Spring Boot esté ejecutándose en el puerto 8080.';
    }

    if (error.status === 404) {
      return 'La ruta de login no está disponible en el backend. Reinicia Spring Boot y verifica /api/auth/login.';
    }

    if (error.status === 405) {
      return 'El backend recibió un método HTTP incorrecto para la ruta de login.';
    }

    return `No se pudo iniciar sesión (HTTP ${error.status}).`;
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

  private readServerMessage(error: HttpErrorResponse): string | null {
    const body = error.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    return null;
  }
}
