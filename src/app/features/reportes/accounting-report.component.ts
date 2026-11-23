import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastoRequest, AccountingService } from './accounting.service';
import { ReporteContable } from '../../core/models/api.models';
import { saveBlob } from '../../core/utils/file-download';

@Component({
  selector: 'app-accounting-report',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './accounting-report.component.html',
})
export class AccountingReportComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AccountingService);

  readonly month = signal(this.currentMonth());
  readonly report = signal<ReporteContable | null>(null);
  readonly loading = signal(false);
  readonly savingExpense = signal(false);
  readonly error = signal('');
  readonly expenseError = signal('');

  readonly expenseForm = this.fb.nonNullable.group({
    fecha: [this.localDateTime(), Validators.required],
    categoria: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    this.loadReport();
  }

  loadReport() {
    const [yearText, monthText] = this.month().split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || month < 1 || month > 12) {
      this.report.set(null);
      this.error.set('Selecciona un mes válido.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.service.monthlyReport(year, month).subscribe({
      next: (value) => this.report.set(value),
      error: (error) => {
        this.report.set(null);
        this.error.set(error.error?.message ?? 'No se pudo cargar el reporte mensual.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  saveExpense() {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.savingExpense.set(true);
    this.expenseError.set('');
    const value = this.expenseForm.getRawValue();
    const request: GastoRequest = { ...value, monto: Number(value.monto) };
    this.service.createExpense(request).subscribe({
      next: () => {
        this.expenseForm.reset({
          fecha: this.localDateTime(),
          categoria: '',
          descripcion: '',
          monto: 0,
        });
        this.loadReport();
      },
      error: (error) => {
        this.expenseError.set(error.error?.message ?? 'No se pudo registrar el gasto.');
        this.savingExpense.set(false);
      },
      complete: () => this.savingExpense.set(false),
    });
  }

  downloadCsv() {
    const report = this.report();
    if (!report) return;

    const headers = [
      'Tipo', 'Fecha', 'Referencia', 'Concepto', 'Categoría', 'Método de pago',
      'Ventas antes de descuentos MXN', 'Descuentos MXN', 'Ingresos netos MXN',
      'Costo mercancía MXN', 'Gastos MXN', 'Compras inventario MXN',
      'Utilidad bruta MXN', 'Utilidad neta MXN',
    ];
    const rows: (string | number)[][] = [
      ['Resumen mensual', `${report.anio}-${String(report.mes).padStart(2, '0')}`, '', '',
        '', '', report.subtotalVentas, report.descuentosVentas, report.ingresosVentas,
        report.costoMercanciaVendida, report.gastosOperativos, report.comprasInventario,
        report.utilidadBruta, report.utilidadNeta],
      ...report.ventas.map((sale) => [
        'Venta', sale.fecha, sale.id, sale.cliente, '', sale.metodoPago,
        sale.subtotal, sale.descuentos, sale.total, sale.costoMercancia, '', '',
        sale.utilidadBruta, '',
      ]),
      ...report.abastecimientos.map((supply) => [
        'Abastecimiento', supply.fecha, supply.id, supply.proveedor, '', '',
        '', '', '', '', '', supply.total, '', '',
      ]),
      ...report.gastos.map((expense) => [
        'Gasto operativo', expense.fecha, expense.id, expense.descripcion, expense.categoria, '',
        '', '', '', '', expense.monto, '', '', '',
      ]),
      ['Nota', '', '', 'Las compras de inventario se muestran por separado y no se restan otra vez de la utilidad neta.', '', '', '', '', '', '', '', '', '', ''],
      ['Nota', '', '', 'Reporte contable interno; no es una declaración ni comprobante fiscal.', '', '', '', '', '', '', '', '', '', ''],
    ];

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => this.csvCell(value)).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    saveBlob(blob, `reporte_contable_${report.anio}-${String(report.mes).padStart(2, '0')}.csv`);
  }

  private csvCell(value: string | number): string {
    const text = typeof value === 'number' ? value.toFixed(2) : value;
    return `"${String(text).replaceAll('"', '""')}"`;
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private localDateTime(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}
