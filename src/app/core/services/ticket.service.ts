import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { saveBlob } from '../utils/file-download';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly api = inject(ApiService);

  downloadPdf(ventaId: number) {
    return this.api
      .getBlob(`ventas/${ventaId}/ticket`)
      .pipe(tap((blob) => saveBlob(blob, `ticket_venta_${ventaId}.pdf`)));
  }

  sendByEmail(ventaId: number, emailDestino: string) {
    return this.api.postText(`emails/ticket/${ventaId}`, null, { emailDestino });
  }

  errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el servidor.';
      if (error.status === 403) return 'No tienes permiso para realizar esta acción.';
      if (error.status === 404) return 'No se encontró el ticket de esta venta.';
    }
    return fallback;
  }
}
