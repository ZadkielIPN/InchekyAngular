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
export type NivelLealtad = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type UnidadMedida = 'PIEZA' | 'KILOGRAMO' | 'LITRO' | 'METRO';

export interface UsuarioSession {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numeroTelefono?: string;
  rol: Rol;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
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
  cantidad: number;
  precioUnitario: number;
  promocionId?: number;
  subtotal?: number;
}

export interface Venta {
  id: number;
  fecha: string;
  cajeroId: number;
  clienteId?: number;
  detalles: DetalleVenta[];
  total: number;
  descuentoPorPuntos?: number;
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
  detalles: DetalleAbastecimiento[];
  total: number;
}
