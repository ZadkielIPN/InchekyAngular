import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, inject, input, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../../core/models/api.models';
import { TicketService } from '../../../core/services/ticket.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-ticket-actions-modal',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './ticket-actions-modal.component.html',
})
export class TicketActionsModalComponent implements OnDestroy {
  private readonly tickets = inject(TicketService);

  readonly venta = input.required<Venta>();
  /** Correo sugerido (normalmente el del cliente de la venta). */
  readonly defaultEmail = input('');
  readonly closed = output<void>();

  readonly downloading = signal(false);
  readonly sending = signal(false);
  readonly showEmailForm = signal(false);
  readonly email = signal('');
  readonly error = signal('');
  readonly success = signal('');

  constructor() {
    document.body.classList.add('modal-open');
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  close() {
    this.closed.emit();
  }

  download() {
    this.resetMessages();
    this.downloading.set(true);
    this.tickets.downloadPdf(this.venta().id).subscribe({
      next: () => {
        this.downloading.set(false);
        this.success.set('Ticket descargado.');
      },
      error: (error) => {
        this.downloading.set(false);
        this.error.set(this.tickets.errorMessage(error, 'No se pudo descargar el ticket.'));
      },
    });
  }

  toggleEmailForm() {
    this.resetMessages();
    if (!this.showEmailForm() && !this.email()) this.email.set(this.defaultEmail());
    this.showEmailForm.update((open) => !open);
  }

  sendEmail() {
    this.resetMessages();
    const destino = this.email().trim();
    if (!EMAIL_PATTERN.test(destino)) {
      this.error.set('Escribe un correo válido.');
      return;
    }
    this.sending.set(true);
    this.tickets.sendByEmail(this.venta().id, destino).subscribe({
      next: () => {
        this.sending.set(false);
        this.success.set(`El ticket se está enviando a ${destino}.`);
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(this.tickets.errorMessage(error, 'No se pudo enviar el ticket.'));
      },
    });
  }

  private resetMessages() {
    this.error.set('');
    this.success.set('');
  }
}
