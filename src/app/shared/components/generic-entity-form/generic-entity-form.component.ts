import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Producto } from '../../../core/models/api.models';
import {
  EntityDropdownComponent,
  EntityDropdownOption,
} from '../entity-dropdown/entity-dropdown.component';

@Component({
  selector: 'app-generic-entity-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EntityDropdownComponent],
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
  readonly products = signal<Producto[]>([]);
  readonly productOptions = signal<EntityDropdownOption[]>([]);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: [''],
    email: ['', Validators.email],
    contrasena: [''],
    telefono: [''],
    direccion: [''],
    turno: ['MATUTINO'],
    cajaAsignada: [1],
    puntos: [0],
    nivelLealtad: ['BRONCE'],
    porcentajeDescuento: [0],
    fechaInicio: [''],
    fechaFin: [''],
    activa: [true],
    productoIds: this.fb.nonNullable.control<number[]>([]),
  });
  constructor() {
    if (this.endpoint === 'promociones') {
      this.api.list<Producto>('productos', 0, 100).subscribe({
        next: (page) => {
          this.products.set(page.content);
          this.productOptions.set(page.content.map((product) => ({
            id: product.id,
            label: product.nombre,
            secondary: `${product.codigoBarras} · Stock ${product.stock}`,
            icon: 'bi-box-seam',
          })));
        },
        error: () => this.error.set('No se pudieron cargar los productos para la promoción.'),
      });
    }

    if (this.endpoint === 'clientes') {
      this.form.controls.apellido.addValidators(Validators.required);
      this.form.controls.email.addValidators(Validators.required);
      this.form.controls.contrasena.addValidators(
        this.id
          ? Validators.pattern(/^$|^.{8,20}$/)
          : [Validators.required, Validators.minLength(8), Validators.maxLength(20)],
      );
      this.form.controls.apellido.updateValueAndValidity();
      this.form.controls.email.updateValueAndValidity();
      this.form.controls.contrasena.updateValueAndValidity();
    }

    if (this.endpoint === 'cajeros') {
      this.form.controls.apellido.addValidators(Validators.required);
      this.form.controls.email.addValidators(Validators.required);
      this.form.controls.contrasena.addValidators(
        this.id
          ? Validators.pattern(/^$|^.{8,20}$/)
          : [Validators.required, Validators.minLength(8), Validators.maxLength(20)],
      );
      this.form.controls.cajaAsignada.addValidators([Validators.required, Validators.min(1)]);
      this.form.controls.apellido.updateValueAndValidity();
      this.form.controls.email.updateValueAndValidity();
      this.form.controls.contrasena.updateValueAndValidity();
      this.form.controls.cajaAsignada.updateValueAndValidity();
    }

    if (this.endpoint === 'administradores') {
      this.form.controls.apellido.addValidators(Validators.required);
      this.form.controls.email.addValidators(Validators.required);
      this.form.controls.contrasena.addValidators(
        this.id
          ? Validators.pattern(/^$|^.{8,20}$/)
          : [Validators.required, Validators.minLength(8), Validators.maxLength(20)],
      );
      this.form.controls.apellido.updateValueAndValidity();
      this.form.controls.email.updateValueAndValidity();
      this.form.controls.contrasena.updateValueAndValidity();
    }

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
    const payload = this.buildPayload();
    const request = this.id
      ? this.api.put(`${this.endpoint}/${this.id}`, payload)
      : this.api.post(this.endpoint, payload);
    request.subscribe({
      next: () => void this.router.navigate(['/', this.endpoint]),
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo guardar.'),
    });
  }

  private buildPayload(): Record<string, unknown> {
    const value = this.form.getRawValue();

    if (this.endpoint === 'clientes') {
      const payload: Record<string, unknown> = {
        nombre: value.nombre,
        apellido: value.apellido,
        email: value.email,
        puntos: value.puntos,
        nivelLealtad: value.nivelLealtad,
      };

      if (!this.id || value.contrasena.trim()) {
        payload['contrasena'] = value.contrasena;
      }

      return payload;
    }

    if (this.endpoint === 'cajeros') {
      const payload: Record<string, unknown> = {
        nombre: value.nombre,
        apellido: value.apellido,
        email: value.email,
        turno: value.turno,
        cajaAsignada: value.cajaAsignada,
      };

      if (!this.id || value.contrasena.trim()) {
        payload['contrasena'] = value.contrasena;
      }

      return payload;
    }

    if (this.endpoint === 'administradores') {
      const payload: Record<string, unknown> = {
        nombre: value.nombre,
        apellido: value.apellido,
        email: value.email,
      };

      if (!this.id || value.contrasena.trim()) {
        payload['contrasena'] = value.contrasena;
      }

      return payload;
    }

    return {
      nombre: value.nombre,
      porcentajeDescuento: value.porcentajeDescuento,
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin || null,
      activa: value.activa,
      productoIds: value.productoIds,
    };
  }
}
