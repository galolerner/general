# SHIELD Platform — MVP

Plataforma SHIELD de **ISEG**: evaluación y screening de postulantes con baterías de
pruebas configurables por nivel de riesgo del puesto, motor de scoring determinístico
y sugerencias de batería potenciadas por IA.

## Stack

- **Next.js 15** (App Router, React 19, Server Actions, Server Components)
- **TypeScript**, Tailwind CSS v3, Montserrat
- **Prisma** + **PostgreSQL** (Supabase / Neon / Postgres local)
- **Auth.js v5** (credentials, JWT)
- **Claude API** (`@anthropic-ai/sdk`) con **prompt caching** para sugerencias de batería
- **jsPDF** para export de fichas y liquidaciones
- **Papaparse** para carga masiva por CSV

## Roles

| Rol | Login |
|---|---|
| **ISEG Admin** | `admin@iseg.com` / `iseg2024` |
| **Cliente CEMACO** | `cemaco@cliente.com` / `cemaco2024` |
| **Cliente BCP** | `bcp@cliente.com` / `bcp2024` |

## Vistas

### Admin
- **Dashboard** — KPIs (totales, contratar, observaciones, no contratar) + últimos candidatos.
- **Candidatos** — sidebar con búsqueda y filtros por dictamen + ficha completa con score gauge,
  verdict, top contribuciones, historial laboral, tabla de pruebas editable, subida de evidencia,
  sugerencia con IA y export PDF.
- **Clientes** — CRUD de organizaciones con stats por cliente.
- **Configuración**
  - **Pruebas**: catálogo CRUD con peso, precio, scores OK/Obs/Fail, bloqueante, integración API.
  - **Puestos & Riesgo**: 5 niveles (Básico → Estratégico) con puestos asociados, batería de
    pruebas, flag bloqueante por nivel y umbrales editables.
  - **Moneda**: selector USD / PEN / MXN / CLP / GTQ.

### Cliente (Portal)
- **Hero** con icono y nombre del cliente + 5 KPIs (Total / Aptos / En revisión / No aptos / Pendientes).
- **Cards** de candidatos con su score, dictamen y nivel.
- **Carga unitaria** (formulario completo con redes sociales y 3 trabajos previos).
- **Carga masiva** vía CSV con plantilla descargable y validación previa.
- **Liquidación mensual** con detalle por candidato + prueba + importe, y export PDF.

## Quick start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
#   → editar DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY

# 3. Crear esquema y semilla
npm run db:push    # crea las tablas
npm run db:seed    # carga 17 pruebas + 5 niveles + 3 usuarios + 1 candidato demo

# 4. Levantar dev server
npm run dev
# http://localhost:3000  →  redirige a /login
```

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (corre `prisma generate` antes) |
| `npm run start` | Servir el build |
| `npm run db:push` | Sincronizar esquema con Prisma |
| `npm run db:seed` | Cargar datos iniciales (idempotente, salvo el candidato demo) |
| `npm run db:reset` | Reset completo + seed |

## Variables de entorno

Ver [.env.example](./.env.example):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Postgres connection string. |
| `AUTH_SECRET` | sí | Firma JWT. Generar con `openssl rand -base64 32`. |
| `ANTHROPIC_API_KEY` | solo IA | API key de [console.anthropic.com](https://console.anthropic.com). |
| `ANTHROPIC_MODEL` | no | Default: `claude-sonnet-4-6`. |

## Arquitectura

```
src/
├── app/
│   ├── (admin)/                    # vistas admin (header con tabs full)
│   │   ├── dashboard/
│   │   ├── candidates/[id]/        # ficha + sub-actions (resultado, notas, API, evidencia)
│   │   ├── clients/                # CRUD
│   │   └── config/
│   │       ├── tests/              # catálogo
│   │       ├── positions/          # niveles + puestos + bateria
│   │       └── currency/
│   ├── (client)/portal/            # portal cliente (header con tabs reducido)
│   │   ├── intake/{,bulk}          # carga unitaria y masiva
│   │   ├── liquidation/            # mensual + PDF
│   │   └── candidate/[id]/         # vista read-only del candidato
│   ├── login/                      # auth.js v5 + server action
│   └── api/
│       ├── auth/[...nextauth]/     # handlers
│       ├── candidates/[id]/pdf/
│       ├── liquidations/.../pdf/
│       └── ai/suggest-battery/     # Claude con prompt caching
├── components/                     # Header, Logo, ScoreGauge, VerdictPill
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── db.ts                       # Prisma singleton
│   ├── scoring.ts                  # computeVerdict (mirror del JS de la maqueta)
│   ├── candidates.ts               # carga + verdicts en batch
│   ├── liquidation.ts              # cálculo mensual
│   └── currency.ts                 # USD/PEN/MXN/CLP/GTQ + nextCandidateCode
├── middleware.ts                   # protección por rol
└── theme via globals.css           # variables CSS heredadas de la maqueta
```

## Motor de scoring

[`src/lib/scoring.ts`](./src/lib/scoring.ts) replica server-side el `computeVerdict()` del HTML
original. Para cada candidato:

1. Toma su nivel de riesgo y la batería de pruebas asociadas (con flags `blocking` snapshot).
2. Por cada prueba aplicada suma `score(status) × peso`.
3. Normaliza a 0–100, compara contra `thresholdOk` / `thresholdObs` del nivel.
4. Si **alguna** prueba bloqueante terminó en `FAIL`, dictamen = **NO CONTRATAR** sin importar
   el score.

## Motor de IA

`POST /api/ai/suggest-battery` — sugiere batería para un puesto a partir de:

- Catálogo completo de pruebas y los defaults por nivel (en system prompt **cacheado**).
- Histórico **anonimizado** de los últimos 12 meses: % `FAIL` / % `OBS` por prueba para
  candidatos cuyo `positionName` matchea el target. **Sin PII de los candidatos**.
- Reglas duras (t1 + t4 obligatorios para puestos con valores; t8 + t15 para crítico/estratégico;
  máx 16 pruebas; etc.).

Devuelve JSON estricto:
```json
{ "suggestedTestIds": ["t1", "t4", "t7", "..."], "reasoning": "..." }
```

## Integraciones API por prueba (mockeadas en MVP)

Cada `Test` tiene los campos `apiEnabled`, `apiUrl`, `apiKey`, `apiMethod`. En el MVP la
acción `callTestApi()` simula una respuesta para validar el flujo. Para producción
(fase 2) ahí va el fetch real con las credenciales reales del proveedor.

## Carga masiva (CSV)

Headers admitidos (case-insensitive, sin acentos):

```
apellidos, nombres, dni, puesto, industria, telefono, direccion, observaciones
```

Solo `apellidos`, `nombres`, `dni` y `puesto` son obligatorios. El nivel de riesgo se asigna
buscando coincidencia parcial entre el `puesto` del CSV y los puestos configurados en cada
nivel. Si no matchea, queda `levelId = null` hasta que el admin lo asigne manualmente.

Plantilla descargable disponible en `/portal/intake/bulk`.

## Liquidación mensual

[`src/lib/liquidation.ts`](./src/lib/liquidation.ts) suma los `priceSnapshot` de todos los
`TestResult` del mes (excluye los `PENDING`). El precio se "congela" al momento de cargar el
resultado, así renombrar/reprecificar pruebas no altera liquidaciones pasadas.

Estados: `DRAFT` → `ISSUED` → `PAID`.

## Logo

El header y la pantalla de login usan [`src/components/Logo.tsx`](./src/components/Logo.tsx),
un placeholder SVG con la marca **ISEG · Innovación en seguridad**. Para reemplazarlo por el
logo definitivo:

1. Subí el archivo a `public/logo-iseg.svg` (o `.png`).
2. Reemplazá el contenido de `Logo.tsx` por:
   ```tsx
   import Image from "next/image";
   export function Logo({ height = 34 }: { height?: number }) {
     return <Image src="/logo-iseg.svg" alt="ISEG" height={height} width={height * 4} priority />;
   }
   ```

## Deploy

### Vercel + Supabase (recomendado)

1. Crear proyecto en [Supabase](https://supabase.com) → copiar `Connection string` (modo
   *transaction*) a `DATABASE_URL`.
2. Crear proyecto en [Vercel](https://vercel.com) apuntando a este repo.
3. Setear envs en Vercel: `DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`.
4. Build command: `prisma generate && next build`. Output: standard.
5. Después del primer deploy correr `npx prisma db push && npx tsx prisma/seed.ts` desde tu
   máquina apuntando a la `DATABASE_URL` de prod.

> **Heads-up sobre evidencias**: en MVP las evidencias suben a `public/uploads/` (filesystem).
> En Vercel el filesystem es efímero. Para prod, cambiar `uploadEvidence()` por Supabase
> Storage o S3 (~30 líneas de código).

## Roadmap (post-MVP)

- [ ] Integraciones reales con APIs de fuentes (antecedentes, financiero, social, etc.)
- [ ] Almacenamiento de evidencia en S3 / Supabase Storage
- [ ] Estados de liquidación con numeración fiscal y pasarela de pago
- [ ] Notificaciones por email cuando un candidato cambia de estado
- [ ] Auditoría / log de cambios
- [ ] Roles adicionales (analista, supervisor de área)
- [ ] Vista admin consolidada de liquidaciones (todos los clientes en una pantalla)

## Maqueta original

El HTML mockup que dio origen al MVP vive en
[`mockup/SHIELD_PLATFORM.html`](./mockup/SHIELD_PLATFORM.html) — useful como referencia visual
mientras evolucionamos el producto.
