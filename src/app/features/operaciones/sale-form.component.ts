import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OperationService } from './operation.service';
import { Cajero, Cliente, Producto } from '../../core/models/api.models';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sale-form.component.html',
})
export class SaleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OperationService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly products = signal<Producto[]>([]);
  readonly clients = signal<Cliente[]>([]);
  readonly cashiers = signal<Cajero[]>([]);

  readonly form = this.fb.nonNullable.group({
    fecha: [new Date().toISOString().slice(0, 16), Validators.required],
    cajeroId: [0, [Validators.required, Validators.min(1)]],
    clienteId: [0],
    puntosUtilizados: [0, [Validators.required, Validators.min(0)]],
    metodoPago: ['EFECTIVO', Validators.required],
    detalles: this.fb.array([this.createDetail()]),
  });

  constructor() {
    this.service.products().subscribe((page) => this.products.set(page.content));
    this.service.clients().subscribe((page) => this.clients.set(page.content));
    this.service.cashiers().subscribe((page) => this.cashiers.set(page.content));
  }

  get details() {
    return this.form.controls.detalles;
  }

  createDetail() {
    return this.fb.nonNullable.group({
      productoId: [0, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
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

    this.service.createSale(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/ventas']),
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo registrar la venta.'),
    });
  }
}
