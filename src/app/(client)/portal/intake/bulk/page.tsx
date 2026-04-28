import Link from "next/link";
import { BulkIntakeForm } from "./BulkIntakeForm";

export default function BulkIntakePage() {
  return (
    <section className="px-8 py-8 max-w-4xl mx-auto">
      <header className="flex items-end justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">Carga masiva</p>
          <h1 className="text-3xl font-light text-text">Importar postulantes desde CSV</h1>
          <p className="text-text-mid text-[13px] mt-2 max-w-2xl">
            Subí un archivo CSV con los datos básicos de varios candidatos. El sistema crea uno por
            fila, los asocia al nivel de riesgo correspondiente al puesto y queda todo listo para
            ejecutar la batería de pruebas.
          </p>
        </div>
        <Link href="/portal/intake" className="btn btn-ghost">
          ← Carga unitaria
        </Link>
      </header>

      <div className="card p-5 mb-6">
        <h3 className="eyebrow mb-3">Formato esperado del CSV</h3>
        <p className="text-text-mid text-[12px] mb-3">
          Encabezados (orden libre, mayúsculas/acentos opcionales):
          <code className="block bg-surface2 p-3 mt-2 text-[11px] mono text-accent">
            apellidos,nombres,dni,puesto,industria,telefono,email,direccion,observaciones
          </code>
        </p>
        <p className="text-text-dim text-[11px]">
          Solo <strong>apellidos</strong>, <strong>nombres</strong>, <strong>dni</strong> y{" "}
          <strong>puesto</strong> son obligatorios.{" "}
          <a
            href="data:text/csv;charset=utf-8,apellidos,nombres,dni,puesto,industria,telefono,direccion,observaciones%0AP%C3%A9rez%2CJuan%2C12345678%2CCajero%2CRetail%2C+5491111%2CAv.%20Siempre%20Viva%20742%2C"
            download="plantilla-shield.csv"
            className="text-accent"
          >
            Descargar plantilla
          </a>
          .
        </p>
      </div>

      <BulkIntakeForm />
    </section>
  );
}
