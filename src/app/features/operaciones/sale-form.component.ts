import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Cajero, Cliente, Producto } from '../../core/models/api.models';
import { OperationService } from './operation.service';

interface TicketItem {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './sale-form.component.html',
})
export class SaleFormComponent {
  private readonly service = inject(OperationService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly products = signal<Producto[]>([]);
  readonly clients = signal<Cliente[]>([]);
  readonly cashiers = signal<Cajero[]>([]);
  readonly ticket = signal<TicketItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly searchQuery = signal('');
  readonly selectedClientId = signal<number | null>(null);
  readonly selectedCashierId = signal<number | null>(null);
  readonly metodoPago = signal('EFECTIVO');
  readonly puntosUtilizados = signal(0);
  readonly total = computed(() =>
    this.ticket().reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0),
  );
  readonly currentUser = this.auth.currentUser;
  private readonly search$ = new Subject<string>();

  constructor() {
    this.loadProducts();
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.service.catalogProducts(query)),
      )
      .subscribe({
        next: (page) => this.products.set(page.content),
        error: () => this.error.set('No se pudo cargar el catálogo de productos.'),
      });
    this.service.clients().subscribe((page) => this.clients.set(page.content));
    if (this.auth.hasRole('ADMINISTRADOR')) {
      this.service.cashiers().subscribe((page) => this.cashiers.set(page.content));
    } else {
      this.selectedCashierId.set(this.auth.currentUser()?.id ?? null);
    }
  }

  searchProducts() {
    this.search$.next(this.searchQuery().trim());
  }

  addProduct(product: Producto) {
    const current = this.ticket();
    const existing = current.find((item) => item.producto.id === product.id);
    if (existing) {
      if (existing.cantidad >= product.stock) {
        this.error.set(`No hay más stock disponible de ${product.nombre}.`);
        return;
      }
      this.ticket.set(current.map((item) =>
        item.producto.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item,
      ));
      return;
    }
    this.ticket.set([...current, { producto: product, cantidad: 1 }]);
    this.error.set('');
  }

  updateQuantity(productId: number, value: string) {
    const cantidad = Number(value);
    const item = this.ticket().find((entry) => entry.producto.id === productId);
    if (!item) return;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > item.producto.stock) {
      this.error.set(`La cantidad de ${item.producto.nombre} debe estar entre 1 y ${item.producto.stock}.`);
      return;
    }
    this.ticket.set(this.ticket().map((entry) =>
      entry.producto.id === productId ? { ...entry, cantidad } : entry,
    ));
    this.error.set('');
  }

  removeProduct(productId: number) {
    this.ticket.set(this.ticket().filter((item) => item.producto.id !== productId));
  }

  save() {
    this.error.set('');
    const cashierId = this.auth.hasRole('CAJERO')
      ? this.auth.currentUser()?.id
      : this.selectedCashierId();
    if (!this.selectedClientId()) {
      this.error.set('Selecciona un cliente para crear el ticket.');
      return;
    }
    if (!cashierId) {
      this.error.set('Selecciona un cajero.');
      return;
    }
    if (!this.ticket().length) {
      this.error.set('Agrega al menos un producto al ticket.');
      return;
    }

    this.loading.set(true);
    this.service.createSale({
      fecha: new Date().toISOString().slice(0, 19),
      cajeroId: cashierId,
      clienteId: this.selectedClientId(),
      puntosUtilizados: this.puntosUtilizados(),
      metodoPago: this.metodoPago(),
      detalles: this.ticket().map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio,
      })),
    }).subscribe({
      next: () => void this.router.navigate(['/ventas']),
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'No se pudo registrar la venta.');
      },
    });
  }

  private loadProducts(query = '') {
    this.service.catalogProducts(query).subscribe({
      next: (page) => this.products.set(page.content),
      error: () => this.error.set('No se pudo cargar el catálogo de productos.'),
    });
  }
}
