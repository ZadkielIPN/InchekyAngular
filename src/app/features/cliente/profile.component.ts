import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioProfile } from '../../core/models/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly profile = signal<UsuarioProfile | null>(null);
  readonly message = signal('');
  readonly error = signal('');
  nombre = '';
  apellido = '';
  email = '';
  contrasena = '';

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.nombre = profile.nombre;
        this.apellido = profile.apellido;
        this.email = profile.email;
      },
      error: () => this.error.set('No se pudo cargar tu perfil.'),
    });
  }

  submit() {
    this.message.set('');
    this.error.set('');
    this.auth.updateProfile({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      contrasena: this.contrasena || undefined,
    }).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.contrasena = '';
        this.message.set('Tu perfil se actualizó correctamente.');
      },
      error: (error) => this.error.set(error?.error?.message || 'No se pudo actualizar tu perfil.'),
    });
  }
}
