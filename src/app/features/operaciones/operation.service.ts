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
import { EMPTY, expand, reduce } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly api = inject(ApiService);

  products() {
    return this.api.list<Producto>('productos', 0, 100).pipe(
      expand((page) =>
        page.number + 1 < page.totalPages
          ? this.api.list<Producto>('productos', page.number + 1, 100)
          : EMPTY,
      ),
      reduce((products, page) => {
        products.push(...page.content);
        return products;
      }, [] as Producto[]),
    );
  }

  catalogProducts(query = '') {
    return this.api.list<Producto>('productos/catalogo', 0, 100, { q: query });
  }

  clients() {
    return this.api.list<Cliente>('clientes', 0, 100);
  }

  clientByNfc(uidNfc: string) {
    return this.api.get<Cliente>(`clientes/tarjeta-nfc?uidNfc=${encodeURIComponent(uidNfc)}`);
  }

  cashiers() {
    return this.api.list<Cajero>('cajeros', 0, 100);
  }

  cashierByNfc(uidNfc: string) {
    return this.api.get<Cajero>(`cajeros/tarjeta-nfc?uidNfc=${encodeURIComponent(uidNfc)}`);
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
