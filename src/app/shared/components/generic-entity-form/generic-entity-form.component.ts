import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-generic-entity-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './generic-entity-form.component.html',
})
export class GenericEntityFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly endpoint = this.route.snapshot.data['endpoint'] as string;
  readonly title = this.route.snapshot.data['title'] as string;
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: [''],
    email: ['', Validators.email],
    telefono: [''],
    direccion: [''],
    puntos: [0],
    nivelLealtad: ['BRONCE'],
    porcentajeDescuento: [0],
    fechaInicio: [''],
    fechaFin: [''],
    activa: [true],
  });
  constructor() {
    if (this.id)
      this.api
        .get<Record<string, unknown>>(`${this.endpoint}/${this.id}`)
        .subscribe((value) => this.form.patchValue(value as never));
  }
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.id
      ? this.api.put(`${this.endpoint}/${this.id}`, this.form.getRawValue())
      : this.api.post(this.endpoint, this.form.getRawValue());
    request.subscribe({
      next: () => void this.router.navigate(['/', this.endpoint]),
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo guardar.'),
    });
  }
}
