import { Component, inject, signal } from '@angular/core';
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
  email = '';
  contrasena = '';
  readonly error = signal('');

  submit() {
    this.error.set('');
    this.auth.login(this.email, this.contrasena).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => this.error.set(this.auth.getLoginErrorMessage(error)),
    });
  }
}
