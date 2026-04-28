# SHIELD Platform — Guía de despliegue (Vercel + Supabase)

> **Audiencia:** equipo de TI / DevOps de ISEG.
> **Tiempo estimado:** 30–45 min (incluye crear cuentas).
> **Costo:** $0 en el tier gratuito de ambos servicios para el MVP/staging.
> **Resultado:** una URL pública (`https://shield-iseg.vercel.app` o el dominio que elijan) con la plataforma corriendo, lista para que el negocio pueda probarla.

---

## 0 · Pre-requisitos

| Cuenta | Para qué | Plan |
|---|---|---|
| **GitHub** con acceso a [`galolerner/general`](https://github.com/galolerner/general) | Repo del código | Existente |
| **Vercel** ([vercel.com](https://vercel.com)) | Hosting frontend + API | Hobby (free) |
| **Supabase** ([supabase.com](https://supabase.com)) | Base de datos PostgreSQL | Free (500 MB / 2 GB tráfico) |
| **Anthropic Console** ([console.anthropic.com](https://console.anthropic.com)) | API key del motor de IA | Pay-as-you-go |
| Una máquina con **Node 20+** y `git` | Ejecutar la migración inicial | — |

---

## 1 · Crear el proyecto en Supabase (DB)

1. **Sign up** en [supabase.com](https://supabase.com) → click **New project**.
2. Datos del proyecto:
   - **Name:** `shield-platform` (o lo que prefieran).
   - **Database password:** generen uno fuerte y guárdenlo. Lo van a usar en la connection string.
   - **Region:** elegir la más cercana a los usuarios (`South America (São Paulo)` es razonable).
   - **Pricing plan:** Free.
3. Esperar ~2 min mientras provisiona.
4. Una vez listo, ir a **Project Settings → Database → Connection string**.
   - Elegir **Mode: Transaction** (es la pooled connection, la que necesita Vercel serverless).
   - Copiar la cadena. Va a verse así:
     ```
     postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
     ```
   - Reemplazar `[YOUR-PASSWORD]` por el password real.
   - Guardar también la **Direct connection** (puerto 5432) — la van a necesitar para correr `db push`.

> **Importante:** la connection string contiene una contraseña. Tratarla como secreto (no commitearla, no Slack público).

---

## 2 · Importar el repo a Vercel

1. **Sign up** en [vercel.com](https://vercel.com) con la cuenta de GitHub que tenga acceso a `galolerner/general`.
2. **Add New → Project** → buscar `general` → click **Import**.
3. **Configure project:**
   - **Framework Preset:** Next.js (lo detecta solo).
   - **Root Directory:** `./` (default).
   - **Branch:** seleccionar `claude/create-mvp-code-DCmk1`.
     - *(Cuando se mergee a `main` en el futuro, Vercel lo hace automáticamente; por ahora estamos desplegando desde la rama del MVP.)*
   - **Build & Output Settings:** dejar default (`prisma generate && next build` ya viene en `package.json`).

4. **Environment Variables** — agregar las siguientes ANTES de hacer deploy:

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | La connection string **pooled** (puerto 6543) de Supabase | Obligatoria |
| `AUTH_SECRET` | String aleatorio largo. Generarlo con `openssl rand -base64 32` | Obligatoria. Si se rota se invalidan todas las sesiones (ideal para post-deploy). |
| `ANTHROPIC_API_KEY` | API key de [console.anthropic.com](https://console.anthropic.com) | Solo si quieren el botón "Sugerir batería con IA". Si falta, el resto de la app sigue funcionando. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Opcional. Default ya es ese. |

5. Click **Deploy**. Esperar ~2-3 min.
6. Cuando termine, Vercel les da la URL `shield-platform.vercel.app` (o el slug que hayan elegido).
   - **Atención:** la URL todavía no funciona porque la DB está vacía. Saltar al siguiente paso.

---

## 3 · Inicializar la base de datos (una sola vez)

Esto crea las tablas y carga datos iniciales: 17 pruebas, 5 niveles de riesgo con sus puestos, los 3 usuarios y 1 candidato demo.

Desde una máquina con Node 20+ instalado:

```bash
# 1. Clonar y posicionarse en la rama
git clone https://github.com/galolerner/general.git shield
cd shield
git checkout claude/create-mvp-code-DCmk1

# 2. Instalar dependencias
npm install

# 3. Apuntar a la DB de prod
#    (usar la DIRECT connection — puerto 5432 — para schema migrations,
#     no la pooled. Después de migrar, Vercel sigue usando la pooled.)
export DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# 4. Crear todas las tablas
npm run db:push

# 5. Cargar datos iniciales (idempotente, se puede correr varias veces)
npm run db:seed
```

Salida esperada del `db:seed`:
```
→ Seeding tests...
→ Seeding risk levels...
→ Seeding clients...
→ Seeding users (admin + 2 client portals)...
→ Seeding settings...
→ Seeding demo candidate...
✓ Seed complete.

  Login as ADMIN:   admin@iseg.com / iseg2024
  Login as CEMACO:  cemaco@cliente.com / cemaco2024
  Login as BCP:     bcp@cliente.com / bcp2024
```

---

## 4 · Smoke test post-deploy

Abrir la URL de Vercel y verificar:

| # | Acción | Esperado |
|---|---|---|
| 1 | Abrir `/` | Redirige a `/login` con el split-screen oscuro y el logo ISEG |
| 2 | Login `admin@iseg.com / iseg2024` | Entra a `/admin/dashboard` con KPIs |
| 3 | Click en "Candidatos" | Aparece el candidato demo "Rodríguez Vega, Carla María" en el sidebar |
| 4 | Click en el candidato | Score gauge, verdict, 11 pruebas, top contribuciones |
| 5 | Logout, login como `cemaco@cliente.com / cemaco2024` | Redirige a `/portal` con el hero de CEMACO |
| 6 | Click "Ingresar candidato" | Formulario de carga unitaria |
| 7 | Completar y guardar | Aparece en el listado del portal y en `/admin/candidates` |
| 8 | En el admin, ficha del candidato → "Sugerir batería con IA" | (Si `ANTHROPIC_API_KEY` está seteada) Devuelve set sugerido en ~2 s |

---

## 5 · Limitaciones conocidas del MVP en Vercel

Ítems a planificar para fase 2 — **ninguno bloquea el demo**, pero hay que conocerlos:

### 5.1 Subida de evidencias (PDF)

El MVP escribe los archivos a `public/uploads/...` en el filesystem. **En Vercel el filesystem es de solo-lectura en runtime**, así que el botón "Subir evidencia" en la ficha del candidato va a fallar silenciosamente.

**Workaround para fase 2** (estimado: 1 día de desarrollo):
- Crear un bucket en **Supabase Storage** (mismo proyecto Supabase, sección Storage).
- Reemplazar `uploadEvidence()` y `removeEvidence()` en
  `src/app/(admin)/candidates/[id]/actions.ts` para usar `@supabase/supabase-js` en lugar de `node:fs`.
- Agregar 2 env vars en Vercel: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### 5.2 Integraciones API a fuentes externas

Las pruebas tienen UI completa para configurar `apiUrl`/`apiKey`/`apiMethod`, pero el botón "API" en la ficha del candidato **simula** una respuesta. Las integraciones reales con cada proveedor requieren credenciales contractuales con cada fuente — fase 2.

### 5.3 Liquidaciones

El cálculo y el PDF están funcionales. **No** hay numeración fiscal ni emisión real ni pasarela de pago — eso es fase 2.

---

## 6 · Hardening de seguridad (recomendado antes de exponer al negocio)

### 6.1 Rotar credenciales seed

Las credenciales `iseg2024`, `cemaco2024`, `bcp2024` son solo para el seed inicial. **Cambiarlas inmediatamente** después del primer login:

- Abrir Supabase → Table Editor → `User` → editar el campo `password` con un hash bcrypt nuevo.
- O — más fácil — agregar un endpoint de "Cambiar contraseña" en fase 2.

### 6.2 Restringir el acceso a Supabase

- En Supabase → Settings → Database → **Network restrictions**, restringir IPs si es posible.
- La API key de Anthropic conviene tenerla **sin límite de gasto desactivado**, pero con un **soft cap** mensual (Console → Settings → Limits) por las dudas.

### 6.3 Variables de entorno

- `AUTH_SECRET` debe ser único por ambiente (no reutilizar entre staging y prod).
- En Vercel, marcar las env vars como **Production / Preview / Development** según corresponda. Para el MVP las 3 en Production alcanza.

### 6.4 Dominio propio

Vercel permite agregar un dominio custom desde **Settings → Domains**. Si ISEG tiene un subdominio tipo `shield.iseg.com`, se configura un registro CNAME apuntando a `cname.vercel-dns.com` y Vercel emite el SSL automáticamente.

---

## 7 · Operación día a día

### Promover cambios

Cuando se mergee la rama del MVP a `main` (o cuando se trabajen nuevas features), Vercel hace deploy automático en cada push. Las variables de entorno se mantienen.

### Actualizar el esquema de DB

Si se agregan campos al modelo Prisma:

```bash
DATABASE_URL="..." npm run db:push     # para cambios sin pérdida de datos
DATABASE_URL="..." npx prisma migrate dev   # para cambios con migrations versionadas
```

### Ver logs

- **Frontend / API logs:** Vercel → Project → Logs (en tiempo real).
- **Database queries / errores:** Supabase → Project → Logs.

### Costos esperados (orden de magnitud)

| Servicio | Free tier alcanza para | Si lo superan |
|---|---|---|
| Vercel Hobby | 100 GB egress/mes, 100 deploys/día | $20/mes (Pro) |
| Supabase Free | 500 MB DB, 2 GB egress | $25/mes (Pro, 8 GB DB) |
| Anthropic | Pay-as-you-go (~$0.003 por sugerencia con prompt caching activo) | — |

Para un piloto con 5 clientes y ~50 candidatos por mes, el free tier de los tres alcanza holgado.

---

## 8 · Soporte

- **Issues / bugs / mejoras:** https://github.com/galolerner/general/issues
- **Maqueta original:** [`mockup/SHIELD_PLATFORM.html`](../mockup/SHIELD_PLATFORM.html) en este repo.
- **Documentación técnica:** [README.md](../README.md) en la raíz del repo.
