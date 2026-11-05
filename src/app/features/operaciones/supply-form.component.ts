import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OperationService } from './operation.service';
import { Producto, Proveedor } from '../../core/models/api.models';
import {
  EntityDropdownComponent,
  EntityDropdownOption,
} from '../../shared/components/entity-dropdown/entity-dropdown.component';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EntityDropdownComponent],
  templateUrl: './supply-form.component.html',
})
export class SupplyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OperationService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly products = signal<Producto[]>([]);
  readonly providers = signal<Proveedor[]>([]);
  readonly providerOptions = signal<EntityDropdownOption[]>([]);
  readonly productOptions = signal<EntityDropdownOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    fecha: [new Date().toISOString().slice(0, 16), Validators.required],
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    detalles: this.fb.array([this.createDetail()]),
  });

  constructor() {
    this.service.products().subscribe((page) => {
      this.products.set(page.content);
      this.productOptions.set(page.content.map((product) => ({
        id: product.id,
        label: product.nombre,
        secondary: `${product.codigoBarras} · Stock ${product.stock}`,
        icon: 'bi-box-seam',
      })));
    });
    this.service.providers().subscribe((page) => {
      this.providers.set(page.content);
      this.providerOptions.set(page.content.map((provider) => ({
        id: provider.id,
        label: provider.nombre,
        secondary: provider.email,
        icon: 'bi-truck',
      })));
    });
  }

  get details() {
    return this.form.controls.detalles;
  }

  createDetail() {
    return this.fb.nonNullable.group({
      productoId: [0, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      costoUnitario: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addDetail() {
    this.details.push(this.createDetail());
  }

  removeDetail(index: number) {
    if (this.details.length > 1) {
      this.details.removeAt(index);
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.service.createSupply(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/abastecimientos']),
      error: (error) =>
        this.error.set(error.error?.message ?? 'No se pudo registrar el abastecimiento.'),
    });
  }
}
