import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: [ 'login.component.css'],
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  @ViewChild('nfcInput') nfcInput?: ElementRef<HTMLInputElement>;

  email = '';
  contrasena = '';
  readonly error = signal('');
  readonly nfcMode = signal(false);
  readonly nfcUid = signal('');
  readonly nfcStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly nfcMessage = signal('');

  enableNfcLogin() {
    this.nfcMode.set(true);
    this.nfcStatus.set('idle');
    this.nfcMessage.set('');
    setTimeout(() => this.nfcInput?.nativeElement.focus());
  }

  disableNfcLogin() {
    this.nfcMode.set(false);
    this.nfcUid.set('');
    this.nfcStatus.set('idle');
    this.nfcMessage.set('');
  }

  onNfcInput(value: string) {
    this.nfcUid.set(value);
  }

  submitNfc() {
    const uid = this.nfcUid().trim();
    if (!uid) {
      this.nfcStatus.set('error');
      this.nfcMessage.set('Pase una tarjeta NFC para iniciar sesión.');
      this.clearAndFocusNfc();
      return;
    }

    this.nfcStatus.set('loading');
    this.nfcMessage.set('Verificando tarjeta...');
    this.auth.loginNfc(uid).subscribe({
      next: (user) => {
        this.nfcStatus.set('success');
        this.nfcMessage.set(`Bienvenido, ${user.nombre} ${user.apellido}`);
        this.clearAndFocusNfc();
        void this.router.navigate(['/']);
      },
      error: (error) => {
        this.nfcStatus.set('error');
        this.nfcMessage.set(this.auth.getLoginErrorMessage(error));
        this.clearAndFocusNfc();
      },
    });
  }

  private clearAndFocusNfc() {
    this.nfcUid.set('');
    if (this.nfcInput) {
      this.nfcInput.nativeElement.value = '';
    }
    if (this.nfcMode()) {
      setTimeout(() => this.nfcInput?.nativeElement.focus());
    }
  }

  submit() {
    this.error.set('');
    this.auth.login(this.email, this.contrasena).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => this.error.set(this.auth.getLoginErrorMessage(error)),
    });
  }
}
