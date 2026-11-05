import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductListComponent } from './features/productos/product-list.component';
import { ProductFormComponent } from './features/productos/product-form.component';
import { ProviderListComponent } from './features/proveedores/provider-list.component';
import { ProviderFormComponent } from './features/proveedores/provider-form.component';
import { GenericEntityListComponent } from './shared/components/generic-entity-list/generic-entity-list.component';
import { GenericEntityFormComponent } from './shared/components/generic-entity-form/generic-entity-form.component';
import { SaleFormComponent } from './features/operaciones/sale-form.component';
import { SupplyFormComponent } from './features/operaciones/supply-form.component';
import { ProfileComponent } from './features/cliente/profile.component';
import { PurchaseHistoryComponent } from './features/cliente/purchase-history.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'perfil', component: ProfileComponent, canActivate: [roleGuard(['CLIENTE'])] },
      { path: 'mis-compras', component: PurchaseHistoryComponent, canActivate: [roleGuard(['CLIENTE'])] },
      { path: 'productos', component: ProductListComponent, canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])] },
      { path: 'productos/nuevo', component: ProductFormComponent, canActivate: [roleGuard(['ADMINISTRADOR'])] },
      { path: 'productos/:id/editar', component: ProductFormComponent, canActivate: [roleGuard(['ADMINISTRADOR'])] },
      { path: 'proveedores', component: ProviderListComponent, canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])] },
      { path: 'proveedores/nuevo', component: ProviderFormComponent, canActivate: [roleGuard(['ADMINISTRADOR'])] },
      { path: 'proveedores/:id/editar', component: ProviderFormComponent, canActivate: [roleGuard(['ADMINISTRADOR'])] },
      {
        path: 'clientes',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])],
        data: {
          title: 'Clientes',
          endpoint: 'clientes',
          columns: ['nombre', 'apellido', 'email', 'puntos', 'nivelLealtad'],
        },
      },
      {
        path: 'clientes/nuevo',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'cliente', endpoint: 'clientes' },
      },
      {
        path: 'clientes/:id/editar',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'cliente', endpoint: 'clientes' },
      },
      {
        path: 'usuarios',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: {
          title: 'Usuarios',
          endpoint: 'usuarios',
          columns: ['nombre', 'apellido', 'email', 'rol'],
          canCreate: false,
          canEdit: false,
        },
      },
      {
        path: 'cajeros',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: {
          title: 'Cajeros',
          endpoint: 'cajeros',
          columns: ['nombre', 'apellido', 'email', 'numeroEmpleado', 'turno', 'cajaAsignada'],
        },
      },
      {
        path: 'cajeros/nuevo',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'cajero', endpoint: 'cajeros' },
      },
      {
        path: 'cajeros/:id/editar',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'cajero', endpoint: 'cajeros' },
      },
      {
        path: 'administradores',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: {
          title: 'Administradores',
          endpoint: 'administradores',
          columns: ['nombre', 'apellido', 'email', 'numeroAdministrador'],
        },
      },
      {
        path: 'administradores/nuevo',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'administrador', endpoint: 'administradores' },
      },
      {
        path: 'administradores/:id/editar',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'administrador', endpoint: 'administradores' },
      },
      {
        path: 'promociones',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: {
          title: 'Promociones',
          endpoint: 'promociones',
          columns: ['nombre', 'porcentajeDescuento', 'fechaInicio', 'fechaFin', 'activa'],
        },
      },
      {
        path: 'promociones/nuevo',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'promoción', endpoint: 'promociones' },
      },
      {
        path: 'promociones/:id/editar',
        component: GenericEntityFormComponent,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        data: { title: 'promoción', endpoint: 'promociones' },
      },
      {
        path: 'ventas',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])],
        data: {
          title: 'Ventas',
          endpoint: 'ventas',
          columns: ['fecha', 'cajeroId', 'clienteId', 'total', 'metodoPago'],
          canEdit: false,
        },
      },
      { path: 'ventas/nuevo', component: SaleFormComponent, canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])] },
      {
        path: 'abastecimientos',
        component: GenericEntityListComponent,
        canActivate: [roleGuard(['ADMINISTRADOR', 'CAJERO'])],
        data: {
          title: 'Abastecimientos',
          endpoint: 'abastecimientos',
          columns: ['fecha', 'proveedorId', 'total'],
          canEdit: false,
        },
      },
      { path: 'abastecimientos/nuevo', component: SupplyFormComponent, canActivate: [roleGuard(['ADMINISTRADOR'])] },
    ],
  },
  { path: '**', redirectTo: '' },
];
