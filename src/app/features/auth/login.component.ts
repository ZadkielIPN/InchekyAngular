import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
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
