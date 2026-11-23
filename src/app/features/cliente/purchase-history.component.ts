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
  readonly ticketError = signal('');

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
    this.ticketError.set('');
    this.downloadingId.set(venta.id);
    this.tickets.downloadPdf(venta.id).subscribe({
      next: () => this.downloadingId.set(null),
      error: (error) => {
        this.downloadingId.set(null);
        this.ticketError.set(
          this.tickets.errorMessage(error, `No se pudo descargar el ticket #${venta.id}.`),
        );
      },
    });
  }

  printTicket(venta: Venta) {
    this.ticketError.set('');
    if (!this.tickets.printTicket(venta)) {
      this.ticketError.set(
        'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.',
      );
    }
  }
}
