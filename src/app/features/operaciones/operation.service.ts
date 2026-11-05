import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import {
  Abastecimiento,
  Cajero,
  Cliente,
  Producto,
  Promocion,
  Proveedor,
  Venta,
} from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly api = inject(ApiService);

  products() {
    return this.api.list<Producto>('productos', 0, 100);
  }

  catalogProducts(query = '') {
    return this.api.list<Producto>('productos/catalogo', 0, 100, { q: query });
  }

  clients() {
    return this.api.list<Cliente>('clientes', 0, 100);
  }

  cashiers() {
    return this.api.list<Cajero>('cajeros', 0, 100);
  }

  promotions() {
    return this.api.list<Promocion>('promociones', 0, 100);
  }

  providers() {
    return this.api.list<Proveedor>('proveedores', 0, 100);
  }

  sales(page = 0) {
    return this.api.list<Venta>('ventas', page);
  }

  supplies(page = 0) {
    return this.api.list<Abastecimiento>('abastecimientos', page);
  }

  createSale(value: unknown) {
    return this.api.post<Venta>('ventas', value);
  }

  createSupply(value: unknown) {
    return this.api.post<Abastecimiento>('abastecimientos', value);
  }

  deleteSale(id: number) {
    return this.api.delete(`ventas/${id}`);
  }

  deleteSupply(id: number) {
    return this.api.delete(`abastecimientos/${id}`);
  }
}
