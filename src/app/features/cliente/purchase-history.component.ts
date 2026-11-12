import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TicketService } from '../../core/services/ticket.service';
import { PageResponse, Venta } from '../../core/models/api.models';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './purchase-history.component.html',
})
export class PurchaseHistoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly tickets = inject(TicketService);
  readonly ventas = signal<Venta[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly downloadingId = signal<number | null>(null);
  readonly downloadError = signal('');

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

  downloadTicket(venta: Venta) {
    this.downloadError.set('');
    this.downloadingId.set(venta.id);
    this.tickets.downloadPdf(venta.id).subscribe({
      next: () => this.downloadingId.set(null),
      error: (error) => {
        this.downloadingId.set(null);
        this.downloadError.set(
          this.tickets.errorMessage(error, `No se pudo descargar el ticket #${venta.id}.`),
        );
      },
    });
  }
}
