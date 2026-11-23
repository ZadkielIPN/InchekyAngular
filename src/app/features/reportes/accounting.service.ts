import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Gasto, ReporteContable } from '../../core/models/api.models';

export interface GastoRequest {
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly api = inject(ApiService);

  monthlyReport(year: number, month: number) {
    return this.api.get<ReporteContable>(
      `reportes/contabilidad?anio=${year}&mes=${month}`,
    );
  }

  createExpense(value: GastoRequest) {
    return this.api.post<Gasto>('gastos', value);
  }
}
