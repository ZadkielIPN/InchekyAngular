import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProviderService } from './provider.service';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './provider-form.component.html',
})
export class ProviderFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProviderService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    telefono: [''],
    email: ['', Validators.email],
    direccion: [''],
    activo: [true],
  });
  constructor() {
    if (this.id) this.service.get(this.id).subscribe((value) => this.form.patchValue(value));
  }
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.id
      ? this.service.update(this.id, this.form.getRawValue())
      : this.service.create(this.form.getRawValue());
    request.subscribe({
      next: () => void this.router.navigate(['/proveedores']),
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo guardar.'),
    });
  }
}
