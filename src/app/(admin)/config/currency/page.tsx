import { revalidatePath } from "next/cache";
import { CURRENCIES, getCurrency, setCurrency, type CurrencyCode } from "@/lib/currency";
import { auth } from "@/lib/auth";

async function setCurrencyAction(formData: FormData) {
  "use server";
  const s = await auth();
  if (!s || s.user.role !== "ADMIN") throw new Error("Unauthorized");
  const code = String(formData.get("code") ?? "USD") as CurrencyCode;
  await setCurrency(code in CURRENCIES ? code : "USD");
  revalidatePath("/admin/config/currency");
  revalidatePath("/admin/config/tests");
}

export const dynamic = "force-dynamic";

export default async function CurrencyPage() {
  const current = await getCurrency();
  return (
    <section className="p-6 lg:p-8 max-w-3xl">
      <header className="mb-6">
        <p className="eyebrow mb-1">Configuración global</p>
        <h1 className="text-3xl font-light text-text">Moneda</h1>
        <p className="text-text-mid text-[13px] mt-2">
          La moneda configurada se usa para mostrar los precios de pruebas y para calcular las
          liquidaciones mensuales de cada cliente.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.entries(CURRENCIES) as [CurrencyCode, (typeof CURRENCIES)[CurrencyCode]][]).map(
          ([code, c]) => {
            const active = code === current;
            return (
              <form key={code} action={setCurrencyAction}>
                <input type="hidden" name="code" value={code} />
                <button
                  type="submit"
                  className={
                    "w-full card p-5 text-left flex items-center justify-between transition " +
                    (active ? "border-accent bg-[rgba(43,214,197,0.06)]" : "hover:border-border2")
                  }
                >
                  <div>
                    <div className="text-3xl mono text-accent">{c.symbol}</div>
                    <div className="text-text font-semibold mt-1">{c.name}</div>
                    <div className="text-text-dim text-[11px] mono">{code}</div>
                  </div>
                  {active ? <span className="pill pill-obs">Activa</span> : null}
                </button>
              </form>
            );
          },
        )}
      </div>
    </section>
  );
}
