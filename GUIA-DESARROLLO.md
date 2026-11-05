# Guia de desarrollo de Incheky

Esta guia resume como esta organizado el proyecto y como continuar el desarrollo de forma segura.

## 1. Repositorios y responsabilidades

El proyecto esta dividido en dos repositorios:

```text
Frontend Angular:
C:\Users\Zadki\IdeaProjects\copilot-worktrees\InchekyAngular\zadkielipn-animated-guide

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

Las rutas no deben repetir `http://localhost:8080`. La URL base esta en `src/environments/environment.ts`.

Los listados paginados reciben:

```text
page=0
size=10
q=texto-opcional
```

Cuando agregues un nuevo buscador, confirma que el controlador, servicio y repositorio de Spring Boot tambien procesen `q`.

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

## 7. Imagenes de productos

Actualmente el producto puede tener una referencia de imagen y el frontend construye la URL de `uploads/productos`.

Para desarrollo local esta estrategia es suficiente. Para produccion se recomienda migrar a un `StorageService` con almacenamiento de objetos:

```text
MinIO en local
S3, Cloudflare R2 o Azure Blob en produccion
```

La base de datos debe guardar una clave como:

```text
productos/10/uuid.webp
```

No guardes archivos binarios grandes dentro de la tabla de productos. Valida MIME, tamano y extension en Spring Boot.

## 8. Backend Spring Boot

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

El backend usa MySQL y una variable de entorno para la contrasena:

```powershell
Set-Location C:\Users\Zadki\IdeaProjects\Incheky
$env:PASSWORD_DB="TU_CONTRASENA"
.\mvnw.cmd spring-boot:run
```

El frontend:

```powershell
Set-Location C:\Users\Zadki\IdeaProjects\copilot-worktrees\InchekyAngular\zadkielipn-animated-guide
npm install
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
git diff --check
```

Backend:

```powershell
.\mvnw.cmd -DskipTests compile
.\mvnw.cmd test
```

Las pruebas completas del backend requieren que MySQL este disponible y que `PASSWORD_DB` sea correcta. Si aparece `Access denied for user 'root'@'localhost'`, revisa la variable de entorno y no cambies las credenciales en el repositorio.

## 11. Flujo de trabajo Git

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

## 12. Checklist para una nueva funcionalidad

- [ ] Entiendo el endpoint y el DTO del backend.
- [ ] La entidad tiene validaciones y mapper.
- [ ] El permiso existe en backend y la ruta tiene guard.
- [ ] La vista es standalone y tiene HTML separado.
- [ ] Los modelos TypeScript coinciden con la respuesta.
- [ ] Los errores de API se muestran al usuario.
- [ ] Probé estados vacios, carga, error y paginacion.
- [ ] Ejecute build, pruebas y `git diff --check`.
- [ ] No agregue secretos, `uploads` ni archivos generados.
