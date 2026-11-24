import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Cajero, Cliente, Producto, Promocion, Venta } from '../../core/models/api.models';
import { OperationService } from './operation.service';
import {
  EntityDropdownComponent,
  EntityDropdownOption,
} from '../../shared/components/entity-dropdown/entity-dropdown.component';
import { TicketActionsModalComponent } from '../../shared/components/ticket-actions-modal/ticket-actions-modal.component';

interface TicketItem {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, EntityDropdownComponent, TicketActionsModalComponent],
  templateUrl: './sale-form.component.html',
})
export class SaleFormComponent {
  private readonly service = inject(OperationService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly products = signal<Producto[]>([]);
  readonly clients = signal<Cliente[]>([]);
  readonly cashiers = signal<Cajero[]>([]);
  readonly promotions = signal<Promocion[]>([]);
  readonly ticket = signal<TicketItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly searchQuery = signal('');
  readonly selectedClientId = signal<number | null>(null);
  readonly nfcClientMode = signal(false);
  readonly nfcClientUid = signal('');
  readonly nfcClientMessage = signal('');
  @ViewChild('clientNfcInput') private clientNfcInput?: ElementRef<HTMLInputElement>;
  readonly selectedCashierId = signal<number | null>(null);
  readonly nfcCashierMode = signal(false);
  readonly nfcCashierUid = signal('');
  readonly nfcCashierMessage = signal('');
  @ViewChild('cashierNfcInput') private cashierNfcInput?: ElementRef<HTMLInputElement>;
  readonly metodoPago = signal('EFECTIVO');
  readonly puntosUtilizados = signal(0);
  readonly confirmedSale = signal<Venta | null>(null);
  readonly confirmedClientEmail = signal('');
  readonly efectivoRecibido = signal<number | null>(null);
  readonly isCash = computed(() => this.metodoPago() === 'EFECTIVO');
  readonly selectedClient = computed(() =>
    this.clients().find((client) => client.id === this.selectedClientId()) ?? null,
  );
  readonly subtotal = computed(() =>
    this.ticket().reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0),
  );
  readonly promotionDiscount = computed(() =>
    this.ticket().reduce((sum, item) => sum + this.itemPromotionDiscount(item), 0),
  );
  readonly subtotalAfterPromotions = computed(() =>
    Math.max(this.subtotal() - this.promotionDiscount(), 0),
  );
  readonly loyaltyDiscount = computed(() => {
    const percentage = { BRONCE: 0, PLATA: 5, ORO: 10 }[this.selectedClient()?.nivelLealtad ?? 'BRONCE'];
    return this.subtotalAfterPromotions() * percentage / 100;
  });
  readonly pointsDiscount = computed(() =>
    Math.min(this.maxPoints(), Math.max(this.puntosUtilizados(), 0)) * 0.5,
  );
  readonly maxPoints = computed(() =>
    Math.min(
      this.selectedClient()?.puntos ?? 0,
      Math.floor(Math.max(this.subtotalAfterPromotions() - this.loyaltyDiscount(), 0) / 0.5),
    ),
  );
  readonly earnedPoints = computed(() => Math.floor(this.total() / 10));
  readonly total = computed(() =>
    Math.max(
      this.subtotalAfterPromotions() - this.loyaltyDiscount() - this.pointsDiscount(),
      0,
    ),
  );
  readonly currentUser = this.auth.currentUser;
  readonly cashierName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.nombre} ${user.apellido}`.trim() : '';
  });
  private readonly search$ = new Subject<string>();
  readonly clientOptions = computed<EntityDropdownOption[]>(() =>
    this.clients().map((client) => ({
      id: client.id,
      label: `${client.nombre} ${client.apellido}`.trim(),
      secondary: client.email,
      icon: 'bi-person',
    })),
  );
  readonly cashierOptions = computed<EntityDropdownOption[]>(() =>
    this.cashiers().map((cashier) => ({
      id: cashier.id,
      label: `${cashier.nombre} ${cashier.apellido}`.trim(),
      secondary: `Empleado ${cashier.numeroEmpleado}`,
      icon: 'bi-person-badge',
    })),
  );

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
    this.service.promotions().subscribe({
      next: (page) => this.promotions.set(page.content),
      error: () => this.error.set('No se pudieron cargar las promociones activas.'),
    });
    if (this.auth.hasRole('ADMINISTRADOR')) {
      this.service.cashiers().subscribe((page) => this.cashiers.set(page.content));
    } else {
      this.selectedCashierId.set(this.auth.currentUser()?.id ?? null);
    }
  }

  searchProducts() {
    this.search$.next(this.searchQuery().trim());
  }

  onClientChange(value: number | null) {
    this.selectedClientId.set(value);
    this.puntosUtilizados.set(0);
  }

  enableNfcClientSelection() {
    this.nfcClientMode.set(true);
    this.nfcClientUid.set('');
    this.nfcClientMessage.set('');
    setTimeout(() => this.clientNfcInput?.nativeElement.focus());
  }

  disableNfcClientSelection() {
    this.nfcClientMode.set(false);
    this.nfcClientUid.set('');
    this.nfcClientMessage.set('');
  }

  onNfcClientInput(value: string) {
    this.nfcClientUid.set(value);
  }

  submitNfcClient() {
    const uidNfc = this.nfcClientUid().trim();
    if (!uidNfc) {
      this.nfcClientMessage.set('No se pudo leer la tarjeta. Selecciona un cliente manualmente.');
      return;
    }

    this.nfcClientMessage.set('Buscando cliente...');
    this.service.clientByNfc(uidNfc).subscribe({
      next: (client) => {
        if (!this.clients().some((item) => item.id === client.id)) {
          this.clients.update((clients) => [...clients, client]);
        }
        this.onClientChange(client.id);
        this.nfcClientMessage.set(`Cliente seleccionado: ${client.nombre} ${client.apellido}`);
        this.clearNfcClientInput();
      },
      error: (error) => {
        this.nfcClientMessage.set(
          error.error?.message ?? 'No se encontró un cliente con esa tarjeta. Puedes seleccionarlo manualmente.',
        );
        this.clearNfcClientInput();
      },
    });
  }

  private clearNfcClientInput() {
    this.nfcClientUid.set('');
    if (this.clientNfcInput) {
      this.clientNfcInput.nativeElement.value = '';
      if (this.nfcClientMode()) {
        setTimeout(() => this.clientNfcInput?.nativeElement.focus());
      }
    }
  }

  enableNfcCashierSelection() {
    this.nfcCashierMode.set(true);
    this.nfcCashierUid.set('');
    this.nfcCashierMessage.set('');
    setTimeout(() => this.cashierNfcInput?.nativeElement.focus());
  }

  disableNfcCashierSelection() {
    this.nfcCashierMode.set(false);
    this.nfcCashierUid.set('');
    this.nfcCashierMessage.set('');
  }

  onNfcCashierInput(value: string) {
    this.nfcCashierUid.set(value);
  }

  submitNfcCashier() {
    const uidNfc = this.nfcCashierUid().trim();
    if (!uidNfc) {
      this.nfcCashierMessage.set('No se pudo leer la tarjeta. Selecciona un cajero manualmente.');
      return;
    }

    this.nfcCashierMessage.set('Buscando cajero...');
    this.service.cashierByNfc(uidNfc).subscribe({
      next: (cashier) => {
        if (!this.cashiers().some((item) => item.id === cashier.id)) {
          this.cashiers.update((cashiers) => [...cashiers, cashier]);
        }
        this.selectedCashierId.set(cashier.id);
        this.nfcCashierMessage.set(`Cajero seleccionado: ${cashier.nombre} ${cashier.apellido}`);
        this.clearNfcCashierInput();
      },
      error: (error) => {
        this.nfcCashierMessage.set(
          error.error?.message ?? 'No se encontró un cajero con esa tarjeta. Puedes seleccionarlo manualmente.',
        );
        this.clearNfcCashierInput();
      },
    });
  }

  private clearNfcCashierInput() {
    this.nfcCashierUid.set('');
    if (this.cashierNfcInput) {
      this.cashierNfcInput.nativeElement.value = '';
      if (this.nfcCashierMode()) {
        setTimeout(() => this.cashierNfcInput?.nativeElement.focus());
      }
    }
  }

  onPointsChange(value: number) {
    const points = Number.isFinite(+value) ? Math.max(+value, 0) : 0;
    this.puntosUtilizados.set(Math.min(Math.floor(points), this.maxPoints()));
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

  activePromotion(product: Producto): Promocion | null {
    const today = new Date();
    return this.promotions()
      .filter((promotion) =>
        promotion.activa
        && (product.promocionIds ?? []).includes(promotion.id)
        && new Date(`${promotion.fechaInicio}T00:00:00`) <= today
        && (!promotion.fechaFin || new Date(`${promotion.fechaFin}T23:59:59`) >= today),
      )
      .sort((a, b) => b.porcentajeDescuento - a.porcentajeDescuento)[0] ?? null;
  }

  itemPromotionDiscount(item: TicketItem): number {
    const promotion = this.activePromotion(item.producto);
    return promotion
      ? item.producto.precio * item.cantidad * promotion.porcentajeDescuento / 100
      : 0;
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
    if (this.puntosUtilizados() > this.maxPoints()) {
      this.error.set(`Los puntos utilizados no pueden superar ${this.maxPoints()} puntos.`);
      return;
    }

    if (this.isCash()) {
      const diferencia = this.cashDifference();
      if (diferencia === null) {
        this.error.set('Captura el efectivo recibido.');
        return;
      }
      if (diferencia < 0) {
        this.error.set('El efectivo recibido no cubre el total de la venta.');
        return;
      }
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
      efectivoRecibido: this.isCash() ? this.efectivoRecibido() : null,
    }).subscribe({
      next: (venta) => {
        this.confirmedClientEmail.set(this.selectedClient()?.email ?? '');
        this.confirmedSale.set(venta);
      },
    });
  }

  closeTicketModal() {
    this.confirmedSale.set(null);
    void this.router.navigate(['/ventas']);
  }

  private loadProducts(query = '') {
    this.service.catalogProducts(query).subscribe({
      next: (page) => this.products.set(page.content),
      error: () => this.error.set('No se pudo cargar el catálogo de productos.'),
    });
  }

  readonly cashDifference = computed(() => {
    const recibido = this.efectivoRecibido();
    return recibido === null ? null : Math.round((recibido - this.total()) * 100) / 100;
  });

  onCashReceivedChange(value: string | number | null) {
    const amount = value === '' || value === null ? null : Number(value);
    this.efectivoRecibido.set(amount !== null && Number.isFinite(amount) && amount >= 0 ? amount : null);
  }
}
