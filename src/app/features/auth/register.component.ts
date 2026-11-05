import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  nombre = '';
  apellido = '';
  email = '';
  contrasena = '';
  confirmarContrasena = '';

  submit() {
    this.error.set('');
    if (this.contrasena !== this.confirmarContrasena) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.auth.register({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      contrasena: this.contrasena,
    }).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => this.error.set(this.auth.getLoginErrorMessage(error)),
    });
  }
}
