import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { PageResponse, Venta } from '../../core/models/api.models';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './purchase-history.component.html',
})
export class PurchaseHistoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly ventas = signal<Venta[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.api.list<Venta>('ventas/mis-compras', 0, 30).subscribe({
      next: (page: PageResponse<Venta>) => {
        this.ventas.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu historial de compras.');
        this.loading.set(false);
      },
    });
  }
}
