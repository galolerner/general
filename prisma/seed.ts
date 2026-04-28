import { PrismaClient, Role, CandidateStatus, TestResultStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ─── 17 default tests (matches the SHIELD mockup catalog) ───
const TESTS = [
  { id: "t1",  name: "Antecedentes judiciales",     weight: 10, price: 45, blocking: true,  description: "Registros penales y judiciales nacionales." },
  { id: "t2",  name: "Verificación laboral",        weight: 8,  price: 35, blocking: false, description: "Empleos anteriores, motivo de salida y desempeño." },
  { id: "t3",  name: "Historial financiero",        weight: 7,  price: 30, blocking: false, description: "Deudas, centrales de riesgo y comportamiento crediticio." },
  { id: "t4",  name: "Base de shoplifting",         weight: 8,  price: 25, blocking: true,  description: "Incidentes de hurto en retail." },
  { id: "t5",  name: "Verificación domiciliaria",   weight: 5,  price: 20, blocking: false, description: "Confirmación física del domicilio." },
  { id: "t6",  name: "Filiación sindical",          weight: 3,  price: 15, blocking: false, description: "Afiliaciones y activismo sindical." },
  { id: "t7",  name: "Prueba de integridad",        weight: 12, price: 80, blocking: false, description: "Test psicométrico de conductas deshonestas." },
  { id: "t8",  name: "Prueba de la verdad (PSE/Polígrafo)", weight: 15, price: 120, blocking: false, description: "Poligrafía / análisis de estrés vocal." },
  { id: "t9",  name: "Examen toxicológico",         weight: 8,  price: 40, blocking: false, description: "Sustancias psicoactivas (orina/sangre)." },
  { id: "t10", name: "Verificación de credenciales",weight: 6,  price: 30, blocking: false, description: "Títulos, certificaciones, licencias." },
  { id: "t11", name: "Evaluación psicológica",      weight: 10, price: 70, blocking: false, description: "Perfil de personalidad y estabilidad emocional." },
  { id: "t12", name: "Referencias personales",      weight: 4,  price: 15, blocking: false, description: "Contacto a referencias personales y profesionales." },
  { id: "t13", name: "Biometría / huella dactilar", weight: 4,  price: 20, blocking: false, description: "Registro biométrico para control de identidad." },
  { id: "t14", name: "Monitoreo de redes sociales", weight: 5,  price: 25, blocking: false, description: "Análisis de perfiles públicos y reputación digital." },
  { id: "t15", name: "Declaración patrimonial",     weight: 6,  price: 35, blocking: false, description: "Bienes, activos y contraste con perfil económico." },
  { id: "t16", name: "Examen médico ocupacional",   weight: 4,  price: 30, blocking: false, description: "Aptitud física para el puesto." },
  { id: "t17", name: "Historial vehicular",         weight: 4,  price: 20, blocking: false, description: "Infracciones, accidentes, licencia vigente." },
] as const;

// ─── 5 risk levels with positions and test batteries ───
const LEVELS = [
  {
    slug: "basico",
    name: "Básico",
    icon: "⬜",
    color: "#8ca0b4",
    description: "Sin acceso a información crítica ni manejo de valores. Contacto indirecto con clientes.",
    thresholdOk: 80,
    thresholdObs: 55,
    order: 1,
    positions: [
      "Vigilante de acceso / portería",
      "Auxiliar de limpieza y mantenimiento",
      "Mensajero / courier interno",
      "Auxiliar de almacén sin manejo de inventario",
      "Personal de cafetería o servicios generales",
    ],
    tests: [
      { id: "t1", blocking: true },
      { id: "t5", blocking: false },
      { id: "t9", blocking: false },
      { id: "t13", blocking: false },
      { id: "t16", blocking: false },
    ],
  },
  {
    slug: "moderado",
    name: "Moderado",
    icon: "🔵",
    color: "#60a0e0",
    description: "Acceso a sistemas o información, sin manejo directo de dinero.",
    thresholdOk: 78,
    thresholdObs: 55,
    order: 2,
    positions: [
      "Supervisor de seguridad",
      "Recepcionista",
      "Auxiliar administrativo",
      "Almacenista con inventario",
      "Vendedor",
      "Técnico IT",
      "Asistente de RRHH",
    ],
    tests: [
      { id: "t1", blocking: true },
      { id: "t2", blocking: false },
      { id: "t5", blocking: false },
      { id: "t7", blocking: false },
      { id: "t9", blocking: false },
      { id: "t10", blocking: false },
      { id: "t11", blocking: false },
      { id: "t13", blocking: false },
      { id: "t14", blocking: false },
    ],
  },
  {
    slug: "sensible",
    name: "Sensible",
    icon: "🟡",
    color: "#f0b429",
    description: "Manejo de dinero, activos o información financiera.",
    thresholdOk: 80,
    thresholdObs: 60,
    order: 3,
    positions: [
      "Cajero",
      "Coordinador de logística",
      "Analista contable",
      "Jefe de tienda",
      "Guardia de valores",
      "Coordinador de compras",
      "Inspector de calidad",
    ],
    tests: [
      { id: "t1", blocking: true },
      { id: "t4", blocking: true },
      { id: "t2", blocking: false },
      { id: "t3", blocking: false },
      { id: "t7", blocking: false },
      { id: "t9", blocking: false },
      { id: "t10", blocking: false },
      { id: "t11", blocking: false },
      { id: "t13", blocking: false },
      { id: "t14", blocking: false },
      { id: "t15", blocking: false },
    ],
  },
  {
    slug: "critico",
    name: "Crítico",
    icon: "🔴",
    color: "#e05c5c",
    description: "Acceso directo a información crítica, manejo de valores y liderazgo.",
    thresholdOk: 82,
    thresholdObs: 62,
    order: 4,
    positions: [
      "Administrador de sistemas",
      "Tesorero",
      "Coordinador de seguridad corporativa",
      "Jefe de bodega",
      "Auditor interno",
      "Asesor legal",
      "Responsable de compras estratégicas",
    ],
    tests: [
      { id: "t1", blocking: true },
      { id: "t4", blocking: true },
      { id: "t2", blocking: false },
      { id: "t3", blocking: false },
      { id: "t6", blocking: false },
      { id: "t7", blocking: false },
      { id: "t8", blocking: false },
      { id: "t9", blocking: false },
      { id: "t10", blocking: false },
      { id: "t11", blocking: false },
      { id: "t13", blocking: false },
      { id: "t14", blocking: false },
      { id: "t15", blocking: false },
    ],
  },
  {
    slug: "estrategico",
    name: "Estratégico",
    icon: "🟣",
    color: "#a78bfa",
    description: "Máxima confianza, toma de decisiones y representación de la empresa.",
    thresholdOk: 85,
    thresholdObs: 65,
    order: 5,
    positions: [
      "Gerente / Director de área",
      "Director de seguridad",
      "CFO",
      "CISO",
      "Responsable de transferencias bancarias",
      "Custodio de valores / bóveda",
      "Ejecutivo con firma autorizada",
      "CEO",
    ],
    tests: [
      { id: "t1", blocking: true },
      { id: "t4", blocking: true },
      { id: "t2", blocking: false },
      { id: "t3", blocking: false },
      { id: "t5", blocking: false },
      { id: "t6", blocking: false },
      { id: "t7", blocking: false },
      { id: "t8", blocking: false },
      { id: "t9", blocking: false },
      { id: "t10", blocking: false },
      { id: "t11", blocking: false },
      { id: "t12", blocking: false },
      { id: "t13", blocking: false },
      { id: "t14", blocking: false },
      { id: "t15", blocking: false },
      { id: "t17", blocking: false },
    ],
  },
];

async function main() {
  console.log("→ Seeding tests...");
  for (const t of TESTS) {
    await db.test.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        description: t.description,
        weight: t.weight,
        price: t.price,
        blocking: t.blocking,
      },
      create: {
        id: t.id,
        name: t.name,
        description: t.description,
        weight: t.weight,
        price: t.price,
        blocking: t.blocking,
      },
    });
  }

  console.log("→ Seeding risk levels...");
  for (const l of LEVELS) {
    const level = await db.riskLevel.upsert({
      where: { slug: l.slug },
      update: {
        name: l.name,
        icon: l.icon,
        color: l.color,
        description: l.description,
        thresholdOk: l.thresholdOk,
        thresholdObs: l.thresholdObs,
        order: l.order,
      },
      create: {
        slug: l.slug,
        name: l.name,
        icon: l.icon,
        color: l.color,
        description: l.description,
        thresholdOk: l.thresholdOk,
        thresholdObs: l.thresholdObs,
        order: l.order,
      },
    });

    // positions
    await db.position.deleteMany({ where: { levelId: level.id } });
    await db.position.createMany({
      data: l.positions.map((name) => ({ name, levelId: level.id })),
    });

    // level tests
    await db.levelTest.deleteMany({ where: { levelId: level.id } });
    await db.levelTest.createMany({
      data: l.tests.map((t) => ({
        levelId: level.id,
        testId: t.id,
        blocking: t.blocking,
      })),
    });
  }

  console.log("→ Seeding clients...");
  const cemaco = await db.client.upsert({
    where: { id: "demo-cemaco" },
    update: {},
    create: {
      id: "demo-cemaco",
      name: "CEMACO",
      industry: "Retail / Construcción",
      icon: "🏪",
    },
  });
  const bcp = await db.client.upsert({
    where: { id: "demo-bcp" },
    update: {},
    create: { id: "demo-bcp", name: "BCP", industry: "Banca / Finanzas", icon: "🏦" },
  });

  console.log("→ Seeding users (admin + 2 client portals)...");
  const adminPass = await bcrypt.hash("iseg2024", 10);
  const cemacoPass = await bcrypt.hash("cemaco2024", 10);
  const bcpPass = await bcrypt.hash("bcp2024", 10);

  await db.user.upsert({
    where: { email: "admin@iseg.com" },
    update: { password: adminPass, name: "Admin ISEG", role: Role.ADMIN, clientId: null },
    create: {
      email: "admin@iseg.com",
      password: adminPass,
      name: "Admin ISEG",
      role: Role.ADMIN,
    },
  });

  await db.user.upsert({
    where: { email: "cemaco@cliente.com" },
    update: { password: cemacoPass, name: "CEMACO", role: Role.CLIENT, clientId: cemaco.id },
    create: {
      email: "cemaco@cliente.com",
      password: cemacoPass,
      name: "CEMACO",
      role: Role.CLIENT,
      clientId: cemaco.id,
    },
  });

  await db.user.upsert({
    where: { email: "bcp@cliente.com" },
    update: { password: bcpPass, name: "BCP", role: Role.CLIENT, clientId: bcp.id },
    create: {
      email: "bcp@cliente.com",
      password: bcpPass,
      name: "BCP",
      role: Role.CLIENT,
      clientId: bcp.id,
    },
  });

  console.log("→ Seeding settings...");
  await db.setting.upsert({
    where: { key: "currency" },
    update: { value: "USD" },
    create: { key: "currency", value: "USD" },
  });

  // ─── Demo candidate (only if none exists yet) ───
  const anyCandidate = await db.candidate.findFirst();
  if (!anyCandidate) {
    console.log("→ Seeding demo candidate...");
    const sensible = await db.riskLevel.findUnique({ where: { slug: "sensible" } });
    const demo = await db.candidate.create({
      data: {
        code: "SH-2026-0001",
        lastName: "Rodríguez Vega",
        firstName: "Carla María",
        dni: "12345678",
        positionName: "Cajero",
        industry: "Retail",
        clientId: cemaco.id,
        levelId: sensible?.id,
        evaluator: "Equipo ISEG",
        status: CandidateStatus.EVALUATING,
        fromPortal: true,
        notes: "Candidata de demostración precargada por el seed.",
      },
    });

    if (sensible) {
      const lts = await db.levelTest.findMany({
        where: { levelId: sensible.id },
        include: { test: true },
      });
      for (const lt of lts) {
        // 70% OK, 25% OBS, 5% pending
        const r = Math.random();
        const status =
          r > 0.95
            ? TestResultStatus.PENDING
            : r > 0.7
              ? TestResultStatus.OBS
              : TestResultStatus.OK;
        await db.testResult.create({
          data: {
            candidateId: demo.id,
            testId: lt.testId,
            status,
            priceSnapshot: lt.test.price,
            blockingSnapshot: lt.blocking,
            weightSnapshot: lt.test.weight,
            notes:
              status === TestResultStatus.OBS
                ? "Hallazgo menor sin bloqueo."
                : "",
          },
        });
      }
    }
  }

  console.log("✓ Seed complete.");
  console.log("");
  console.log("  Login as ADMIN:   admin@iseg.com / iseg2024");
  console.log("  Login as CEMACO:  cemaco@cliente.com / cemaco2024");
  console.log("  Login as BCP:     bcp@cliente.com / bcp2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
