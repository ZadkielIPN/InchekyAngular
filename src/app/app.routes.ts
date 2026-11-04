import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductListComponent } from './features/productos/product-list.component';
import { ProductFormComponent } from './features/productos/product-form.component';
import { ProviderListComponent } from './features/proveedores/provider-list.component';
import { ProviderFormComponent } from './features/proveedores/provider-form.component';
import { GenericEntityListComponent } from './shared/components/generic-entity-list/generic-entity-list.component';
import { GenericEntityFormComponent } from './shared/components/generic-entity-form/generic-entity-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'productos', component: ProductListComponent },
      { path: 'productos/nuevo', component: ProductFormComponent },
      { path: 'productos/:id/editar', component: ProductFormComponent },
      { path: 'proveedores', component: ProviderListComponent },
      { path: 'proveedores/nuevo', component: ProviderFormComponent },
      { path: 'proveedores/:id/editar', component: ProviderFormComponent },
      { path: 'clientes', component: GenericEntityListComponent, data: { title: 'Clientes', endpoint: 'clientes', columns: ['nombre','apellido','email','puntos','nivelLealtad'] } },
      { path: 'clientes/nuevo', component: GenericEntityFormComponent, data: { title: 'cliente', endpoint: 'clientes' } },
      { path: 'clientes/:id/editar', component: GenericEntityFormComponent, data: { title: 'cliente', endpoint: 'clientes' } },
      { path: 'usuarios', component: GenericEntityListComponent, data: { title: 'Usuarios', endpoint: 'usuarios', columns: ['nombre','apellido','email','rol'] } },
      { path: 'promociones', component: GenericEntityListComponent, data: { title: 'Promociones', endpoint: 'promociones', columns: ['nombre','porcentajeDescuento','fechaInicio','fechaFin','activa'] } },
      { path: 'promociones/nuevo', component: GenericEntityFormComponent, data: { title: 'promoción', endpoint: 'promociones' } },
      { path: 'promociones/:id/editar', component: GenericEntityFormComponent, data: { title: 'promoción', endpoint: 'promociones' } },
      { path: 'ventas', component: GenericEntityListComponent, data: { title: 'Ventas', endpoint: 'ventas', columns: ['fecha','cajeroId','clienteId','total','metodoPago'], canCreate: false } },
      { path: 'abastecimientos', component: GenericEntityListComponent, data: { title: 'Abastecimientos', endpoint: 'abastecimientos', columns: ['fecha','proveedorId','total'], canCreate: false } },
    ],
  },
  { path: '**', redirectTo: '' },
];
