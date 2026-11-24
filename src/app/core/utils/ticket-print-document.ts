import type { DetalleVenta, Venta } from '../models/api.models';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0);
}

function detailTotal(detail: DetalleVenta): number {
  return (
    detail.total ??
    detail.subtotal ??
    detail.cantidad * detail.precioUnitario - (detail.descuentoImporte ?? 0)
  );
}

function detailMarkup(detail: DetalleVenta): string {
  const name = escapeHtml(detail.productoNombre ?? `Producto #${detail.productoId}`);
  const promotion =
    detail.descuentoImporte && detail.descuentoImporte > 0
      ? `<div class="promotion">Promoción -${escapeHtml(String(detail.descuentoPorcentaje ?? 0))}%: -${money(detail.descuentoImporte)}</div>`
      : '';

  return `<article class="item">
    <div class="item-name">${name}</div>
    <div class="item-row">
      <span>${detail.cantidad} x ${money(detail.precioUnitario)}</span>
      <strong>${money(detailTotal(detail))}</strong>
    </div>
    ${promotion}
  </article>`;
}

function saleDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX');
}

export function createTicketPrintDocument(venta: Venta, logoUrl: string): string {
  const cashier = venta.cajeroNombre?.replace(/^\d+\s*-\s*/, '') || 'N/A';
  const client = venta.clienteNombre || 'Público General';
  const items = (venta.detalles ?? []).map(detailMarkup).join('');
  const rows = [
    ['Subtotal', money(venta.subtotal)],
    ['Promociones', `-${money(venta.descuentoPromociones)}`],
    ['Descuento por nivel', `-${money(venta.descuentoNivel)}`],
    [`Descuento por puntos (${venta.puntosUtilizados ?? 0})`, `-${money(venta.descuentoPuntos)}`],
  ]
    .map(
      ([label, value]) =>
        `<div class="summary-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`,
    )
    .join('');
  const cashRows =
    venta.efectivoRecibido == null
      ? ''
      : `<div class="summary-row"><span>Efectivo recibido</span><strong>${money(venta.efectivoRecibido)}</strong></div>
       <div class="summary-row"><span>Cambio</span><strong>${money(venta.cambio)}</strong></div>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket de venta #${venta.id}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: 58mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; color: #111; font: 10px Arial, sans-serif; }
    body { background: #f3f4f6; }
    .toolbar { display: flex; justify-content: center; gap: 8px; padding: 12px; }
    .toolbar button { padding: 8px 12px; border: 0; border-radius: 4px; background: #1d4ed8; color: white; cursor: pointer; }
    .ticket { width: 58mm; margin: 12px auto; padding: 3mm; background: white; }
    .ticket-logo { display: block; width: 14mm; height: auto; margin: 0 auto 2mm; }
    h1 { margin: 0; text-align: center; font-size: 15px; }
    .center { text-align: center; }
    .muted { color: #555; }
    .rule { margin: 8px 0; border: 0; border-top: 1px dashed #555; }
    .item { padding: 5px 0; border-bottom: 1px dashed #aaa; }
    .item-name { overflow-wrap: anywhere; font-weight: 700; }
    .item-row, .summary-row { display: flex; justify-content: space-between; gap: 6px; margin-top: 3px; }
    .item-row > *, .summary-row > * { min-width: 0; overflow-wrap: anywhere; }
    .promotion { margin-top: 2px; color: #333; }
    .total { margin-top: 7px; font-size: 13px; font-weight: 700; }
    .points { margin-top: 6px; text-align: center; }
    .footer { margin-top: 12px; text-align: center; }
    @media print {
      html, body { width: 58mm; background: white; }
      .toolbar { display: none !important; }
      .ticket { width: 44mm; margin: 0 auto; padding: 1.5mm; transform: translateX(-5mm); }
      .ticket-logo { filter: grayscale(1) contrast(1.8); }
      .item-row, .summary-row { display: grid; grid-template-columns: minmax(0, 1fr) max-content; column-gap: 2mm; }
      .item-row strong, .summary-row strong { justify-self: end; white-space: nowrap; }
    }
  </style>
</head>
<body>
  <nav class="toolbar" aria-label="Acciones de impresión">
    <button type="button" onclick="window.print()">Imprimir ticket</button>
    <button type="button" onclick="window.close()">Cerrar</button>
  </nav>
  <main class="ticket">
    <img class="ticket-logo" src="${escapeHtml(logoUrl)}" alt="Incheky">
    <h1>INCHEKI STORE</h1>
    <div class="center muted">Ticket de venta #${venta.id}</div>
    <hr class="rule">
    <div>Fecha: ${escapeHtml(saleDate(venta.fecha))}</div>
    <div>Cajero: ${escapeHtml(cashier)}</div>
    <div>Cliente: ${escapeHtml(client)}</div>
    <div>Método de pago: ${escapeHtml(venta.metodoPago)}</div>
    <hr class="rule">
    ${items}
    <hr class="rule">
    ${rows}
    <div class="summary-row total"><span>TOTAL</span><strong>${money(venta.total)}</strong></div>
    ${cashRows}
    <div class="points">Puntos ganados: ${venta.puntosGanados ?? 0}</div>
    <div class="footer">¡Gracias por su compra!</div>
  </main>
  <script>window.addEventListener('load', () => { window.focus(); window.print(); });</script>
</body>
</html>`;
}
