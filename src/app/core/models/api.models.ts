export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  message?: string;
  path?: string;
  errors?: Record<string, string>;
}

export type Rol = 'CLIENTE' | 'ADMINISTRADOR' | 'CAJERO';
export type Turno = 'MATUTINO' | 'VESPERTINO' | 'NOCTURNO';
export type NivelLealtad = 'BRONCE' | 'PLATA' | 'ORO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type UnidadMedida =
  | 'KILOGRAMO'
  | 'GRAMO'
  | 'LITRO'
  | 'MILILITRO'
  | 'METRO'
  | 'CENTIMETRO'
  | 'PIEZA';

export interface BajaResponse {
  eliminado: boolean;
  mensaje: string;
}

export interface UsuarioSession {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numeroTelefono?: string;
  rol: Rol;
}

export interface UsuarioProfile {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  puntos?: number;
  nivelLealtad?: NivelLealtad;
}

export interface UsuarioProfileRequest {
  nombre: string;
  apellido: string;
  email: string;
  contrasena?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  uidNfc?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  peso: number;
  valoracion?: number;
  activo: boolean;
  codigoBarras: string;
  unidadMedida: UnidadMedida;
  fechaCaducidad?: string;
  imagen?: string;
  promocionIds?: number[];
}

export interface Promocion {
  id: number;
  nombre: string;
  porcentajeDescuento: number;
  fechaInicio: string;
  fechaFin?: string;
  activa: boolean;
  productoIds?: number[];
}

export interface Cliente extends Usuario {
  puntos: number;
  nivelLealtad: NivelLealtad;
}

export interface Cajero extends Usuario {
  numeroEmpleado: number;
  turno: Turno;
  cajaAsignada: number;
}

export interface Administrador extends Usuario {
  numeroAdministrador?: number;
}

export interface DetalleVenta {
  id?: number;
  productoId: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  promocionId?: number;
  descuentoPorcentaje?: number;
  descuentoImporte?: number;
  subtotal?: number;
  total?: number;
}

export interface Venta {
  id: number;
  fecha: string;
  cajeroId: number;
  cajeroNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
  detalles: DetalleVenta[];
  subtotal?: number;
  descuentoPromociones?: number;
  descuentoNivel?: number;
  descuentoPuntos?: number;
  total: number;
  descuento?: number;
  efectivoRecibido?: number | null;
  cambio?: number | null;
  puntosUtilizados: number;
  puntosGanados?: number;
  metodoPago: MetodoPago;
}

export interface DetalleAbastecimiento {
  id?: number;
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  subtotal?: number;
}

export interface Abastecimiento {
  id: number;
  fecha: string;
  proveedorId: number;
  proveedorNombre?: string;
  detalles: DetalleAbastecimiento[];
  total: number;
}

export interface Gasto {
  id: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
}

export interface ReporteVenta {
  id: number;
  fecha: string;
  cliente: string;
  metodoPago: MetodoPago;
  subtotal: number;
  descuentos: number;
  total: number;
  costoMercancia: number;
  utilidadBruta: number;
}

export interface ReporteAbastecimiento {
  id: number;
  fecha: string;
  proveedor: string;
  total: number;
}

export interface ReporteContable {
  anio: number;
  mes: number;
  subtotalVentas: number;
  descuentosVentas: number;
  ingresosVentas: number;
  costoMercanciaVendida: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadNeta: number;
  comprasInventario: number;
  ventas: ReporteVenta[];
  abastecimientos: ReporteAbastecimiento[];
  gastos: Gasto[];
}
