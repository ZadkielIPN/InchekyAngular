# Guia de desarrollo de Incheky

Esta guia resume como esta organizado el proyecto y como continuar el desarrollo de forma segura.

## 1. Repositorios y responsabilidades

El proyecto esta dividido en dos repositorios:

```text
Frontend Angular:
C:\Users\Zadki\WebstormProjects\InchekyAngular

Backend Spring Boot:
C:\Users\Zadki\IdeaProjects\Incheky
```

El frontend consume la API del backend mediante `http://localhost:8080/api`. Angular no debe duplicar las reglas de seguridad ni los calculos definitivos: el backend es la fuente de verdad.

## 2. Arquitectura del frontend

La aplicacion usa Angular standalone, sin `NgModule`.

```text
src/app
├── core
│   ├── guards       Guards de autenticacion y roles
│   ├── models       Interfaces TypeScript de la API
│   └── services      API, autenticacion y sesion
├── shared
│   └── components    Componentes reutilizables
└── features
    ├── auth          Login y registro
    ├── cliente       Perfil e historial
    ├── dashboard
    ├── layout
    ├── operaciones   Ventas y abastecimientos
    ├── productos
    └── proveedores
```

Cada feature debe contener su logica en `.ts` y su vista en `.html`. Los componentes nuevos deben ser `standalone`, usar `inject()` y preferir `signal()`, `computed()` y `effect()` para estado local.

### Donde modificar cada cosa

| Necesidad | Ubicacion |
|---|---|
| Nueva ruta o permiso visual | `src/app/app.routes.ts` |
| Modelo de respuesta o request | `src/app/core/models/api.models.ts` |
| Llamada HTTP reutilizable | `src/app/core/services/api.service.ts` |
| Login, usuario actual o rol | `src/app/core/services/auth.service.ts` |
| Componente compartido | `src/app/shared/components` |
| Pantalla de negocio | `src/app/features/<feature>` |
| Estilos globales | `src/styles.css` |

## 3. Servicios y llamadas HTTP

`ApiService` centraliza las llamadas:

```ts
this.api.list<Producto>('productos', 0, 10, { q: 'cafe' });
this.api.get<Producto>('productos/5');
this.api.post<Producto>('productos', payload);
this.api.put<Producto>('productos/5', payload);
this.api.delete('productos/5');
```

Las rutas no deben repetir `http://localhost:8080`. La URL base esta en:

- Desarrollo: `src/environments/environment.ts`.
- Produccion: `src/environments/environment.prod.ts`.

Los listados paginados reciben:

```text
page=0
size=20
q=texto-opcional
```

La API acepta el tamano mediante `Pageable`; los componentes de interfaz pueden elegir un tamano distinto. Los listados genericos y el catalogo del cliente usan actualmente 20 elementos por pagina. Cuando agregues un nuevo buscador, confirma que el controlador, servicio y repositorio de Spring Boot tambien procesen `q`.

## 4. Autenticacion y roles

La aplicacion usa sesion HTTP, no JWT.

1. Angular hace login en `POST /api/auth/login`.
2. El backend guarda el usuario en la sesion.
3. Angular envia cookies mediante `withCredentials`.
4. `authGuard` evita entrar sin sesion.
5. `roleGuard([...])` protege rutas por rol.
6. El interceptor backend valida permisos para cada `/api/**`.

Roles actuales:

```text
CLIENTE
CAJERO
ADMINISTRADOR
```

El guard del frontend solo mejora la experiencia. La autorizacion real siempre debe quedar en `ApiAuthorizationInterceptor` y en las validaciones del backend.

## 5. Flujo de ventas

La venta se crea desde:

```text
src/app/features/operaciones/sale-form.component.ts
src/app/features/operaciones/sale-form.component.html
```

El payload principal contiene:

```json
{
  "cajeroId": 6,
  "clienteId": 5,
  "puntosUtilizados": 0,
  "metodoPago": "EFECTIVO",
  "detalles": [
    {
      "productoId": 10,
      "cantidad": 2,
      "precioUnitario": 25
    }
  ]
}
```

El backend valida stock, calcula promociones, descuento de nivel, descuento por puntos, total y puntos ganados. La vista solo muestra una estimacion para que el cajero pueda revisar el ticket.

La lista de ventas usa el componente generico y ahora muestra el ID como primera columna. El ID proviene de `VentaResponse.id`; no se genera en Angular.

La impresion fisica esta disponible al registrar una venta, desde el historial de compras y el detalle de ventas. Abre el dialogo de impresion del navegador con formato para rollo POS de 60 mm (58 mm imprimibles); configura ese papel en el controlador de la impresora. La descarga PDF y el envio por correo permanecen disponibles.

## 6. Promociones y fidelizacion

Las promociones tienen:

```text
nombre
porcentajeDescuento
fechaInicio
fechaFin
activa
productoIds
```

El formulario esta en `GenericEntityFormComponent` porque comparte estructura con otras entidades. Los productos se seleccionan con `EntityDropdownComponent` en modo multiple.

Reglas actuales:

- Solo se aplican promociones activas.
- La fecha actual debe estar entre inicio y fin.
- Si un producto tiene varias promociones vigentes, se usa el porcentaje mayor.
- El descuento promocional se aplica antes del descuento por nivel.
- Cada punto utilizado descuenta $0.50.
- Se gana un punto por cada $10 del total final.

Si modificas una regla, cambia primero el backend y despues ajusta la estimacion Angular.

## 7. Reporte contable mensual

El modulo `/reportes/contabilidad` esta disponible solo para administradores y consulta `GET /api/reportes/contabilidad?anio=AAAA&mes=M`. Los gastos operativos se capturan mediante `POST /api/gastos`; ambos endpoints validan el rol en el interceptor del backend.

La utilidad neta se calcula como ventas netas menos costo promedio ponderado de la mercancia vendida menos gastos operativos capturados. Los abastecimientos del mes aparecen por separado como compras de inventario y no se descuentan otra vez de la utilidad. El costo de cada venta se conserva en su detalle para mantener su costo historico; por eso las existencias iniciales y ajustes de stock deben registrarse como abastecimientos.

El CSV es un reporte contable interno, no una declaracion fiscal ni un CFDI. No contiene calculo de impuestos, deducciones ni validacion de requisitos para presentaciones ante autoridades fiscales.

## 8. Imagenes de productos

Actualmente el producto guarda el nombre de archivo y el frontend construye la URL de `uploads/productos`. Spring Boot guarda las imagenes en `<UPLOAD_DIR>/productos` y publica el directorio configurado mediante `/uploads/**`.

La variable de entorno `UPLOAD_DIR` define el directorio base. En local, el valor predeterminado es `uploads`, por lo que las imagenes se almacenan en `uploads/productos`. En Azure, configura `UPLOAD_DIR` con una ruta persistente y escribible por la aplicacion; el almacenamiento efimero local del App Service puede perder archivos al reiniciar o desplegar. Confirma la persistencia y el respaldo en la configuracion real de Azure antes de depender de ella.

La edicion envia la nueva imagen como multipart. Si se reemplaza una imagen local, el backend elimina la anterior despues del commit. No borres manualmente el directorio configurado ni guardes secretos/credenciales en el repositorio.

Si mas adelante se requiere escalado horizontal, CDN o almacenamiento duradero administrado, se puede migrar a un `StorageService` con Azure Blob Storage:

```text
Emulador compatible con Azure Blob en local
Azure Blob Storage en produccion
```

En esa migracion futura, la base de datos podria guardar una clave como (actualmente guarda solo el nombre del archivo):

```text
productos/10/uuid.webp
```

No guardes archivos binarios grandes dentro de la tabla de productos. Valida MIME, tamano y extension en Spring Boot.

## 9. Backend Spring Boot

La estructura principal es:

```text
src/main/java/org/handel/incheki
├── config
├── controller
├── dtos
├── enums
├── exceptions
├── mappers
├── model
├── repository
└── service
```

Flujo recomendado para una entidad:

1. Crear o actualizar el modelo JPA.
2. Crear DTOs de request y response.
3. Crear mapper MapStruct.
4. Crear repository.
5. Crear interfaz de service.
6. Implementar service con validaciones y transacciones.
7. Crear controller `/api/...`.
8. Agregar permisos en `ApiAuthorizationInterceptor`.
9. Conectar el servicio Angular.
10. Agregar la ruta y la vista.

Usa `@Transactional` para operaciones que modifican varias entidades o stock. Usa `@Transactional(readOnly = true)` para consultas.

## 9. Configuracion local

El backend usa MySQL y estas variables de entorno, definidas en `src/main/resources/application.yaml`:

```powershell
Set-Location C:\Users\Zadki\IdeaProjects\Incheky
$env:DB_HOST="localhost"
$env:DB_NAME="incheky"
$env:DB_USER="TU_USUARIO"
$env:DB_PASSWORD="TU_CONTRASENA"
$env:MAIL_PASSWORD="TU_CONTRASENA_DE_APLICACION"
$env:UPLOAD_DIR="uploads"
$env:CORS_ALLOWED_ORIGINS="http://localhost:4200"
$env:COOKIE_SAME_SITE="lax"
$env:COOKIE_SECURE="false"
.\mvnw.cmd spring-boot:run
```

`PORT` es opcional y por defecto usa `8080`. No guardes valores reales de contrasenas, tokens ni claves en el repositorio; configura los secretos mediante variables de entorno o el almacen de secretos de Azure.

Como el frontend de Azure Static Web Apps y el backend de App Service suelen tener dominios distintos, en produccion la cookie de sesion puede requerir `COOKIE_SAME_SITE="none"` junto con `COOKIE_SECURE="true"` y HTTPS. Si se usa un dominio personalizado que hace que ambos servicios sean same-site, confirma la politica adecuada para esa topologia. La API ya permite credenciales CORS; `CORS_ALLOWED_ORIGINS` debe contener el origen exacto del frontend, nunca `*`.

El frontend:

```powershell
Set-Location C:\Users\Zadki\WebstormProjects\InchekyAngular
npm ci
npm start
```

Abre:

```text
Frontend: http://localhost:4200
Backend:  http://localhost:8080
```

Nunca subas contrasenas, tokens ni archivos de `uploads` al repositorio.

## 10. Validacion antes de guardar cambios

Frontend:

```powershell
npm run build
npm test -- --watch=false
```

Backend:

```powershell
.\mvnw.cmd -DskipTests compile
.\mvnw.cmd test
```

Las pruebas unitarias enfocadas no requieren una base de datos. La prueba `InchekyApplicationTests` inicia el contexto completo y necesita que MySQL este disponible y que `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` sean correctas. Si aparece un error de acceso a MySQL, revisa esas variables y no cambies credenciales en el repositorio.

El build Angular tiene un presupuesto inicial de advertencia de 850 kB y de error de 1 MB. El umbral es una alerta de mantenimiento, no una optimizacion: revisa la carga diferida y el tamano real si el bundle vuelve a acercarse al limite de error.

## 11. Despliegue actual en Azure

Los workflows estan en los repositorios y se ejecutan al actualizar `master`:

- Frontend: `.github/workflows/azure-static-web-apps-gentle-meadow-09d0cae1e.yml` despliega Angular a Azure Static Web Apps. El workflow usa `dist/InchekyAngular/browser` y el secreto `AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_MEADOW_09D0CAE1E`.
- Backend: `C:\Users\Zadki\IdeaProjects\Incheky\.github\workflows\master_incheky-backend.yml` construye un JAR con Maven y lo despliega a Azure App Service `Incheky-Backend`. Usa autenticacion federada de Azure configurada en GitHub Actions.

El workflow backend actualmente construye con `-DskipTests`; el workflow frontend no ejecuta `npm test` de forma explicita. Ejecuta las pruebas y builds localmente antes de integrar cambios. Configura en Azure App Service las variables necesarias del backend (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MAIL_PASSWORD`, `UPLOAD_DIR`, `CORS_ALLOWED_ORIGINS`, `COOKIE_SAME_SITE`, `COOKIE_SECURE` y, si aplica, `PORT`). En dominios separados, configura `COOKIE_SAME_SITE=None` y `COOKIE_SECURE=true` sobre HTTPS; permite solo el origen real del frontend en `CORS_ALLOWED_ORIGINS` (no uses `*` con credenciales).

## 12. Flujo de trabajo Git

Antes de comenzar:

```powershell
git status
git fetch origin --prune
```

Para actualizar la rama con `master` sin eliminar cambios:

```powershell
git stash push --include-untracked -m "wip"
git merge origin/master
git stash pop
```

Revisa los conflictos manualmente. No uses `git reset --hard` para resolverlos sin confirmar primero que puedes perder cambios.

Commit recomendado:

```powershell
git add <archivos>
git commit -m "feat: descripcion breve"
git push origin <rama>
```

Mantén los commits enfocados. No mezcles cambios del backend y frontend si pueden revisarse por separado.

## 13. Checklist para una nueva funcionalidad

- [ ] Entiendo el endpoint y el DTO del backend.
- [ ] La entidad tiene validaciones y mapper.
- [ ] El permiso existe en backend y la ruta tiene guard.
- [ ] La vista es standalone y tiene HTML separado.
- [ ] Los modelos TypeScript coinciden con la respuesta.
- [ ] Los errores de API se muestran al usuario.
- [ ] Probé estados vacios, carga, error y paginacion.
- [ ] Ejecute build, pruebas y `git diff --check`.
- [ ] No agregue secretos, `uploads` ni archivos generados.
