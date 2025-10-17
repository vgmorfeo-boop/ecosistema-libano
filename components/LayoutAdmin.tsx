import Link from "next/link";
import { ReactNode, useEffect } from "react";

export default function LayoutAdmin({ title, children }: { title?: string; children: ReactNode }) {
  useEffect(() => {
    console.log("LayoutAdmin v3 cargado (sin redirección)");
    // 🔕 Intencionalmente SIN redirección por ahora.
  }, []);

  const logout = () => {
    sessionStorage.removeItem("admin_pin");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span className="font-semibold text-gray-800">Ecosistema Líbano — Admin</span>
            {title && <span className="ml-3 text-sm text-gray-500">/ {title}</span>}
          </div>
          <button onClick={logout} className="text-sm px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="bg-white border rounded-xl p-3 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.15)]">
            <Link className="block px-3 py-2 rounded hover:bg-gray-50 text-sm" href="/admin">Panel</Link>
            <Link className="block px-3 py-2 rounded hover:bg-gray-50 text-sm" href="/admin/aspirantes">Aspirantes</Link>
            <Link className="block px-3 py-2 rounded hover:bg-gray-50 text-sm" href="/admin/vacantes">Vacantes</Link>
            <Link className="block px-3 py-2 rounded hover:bg-gray-50 text-sm" href="/admin/arriendos">Arriendos</Link>
            <Link className="block px-3 py-2 rounded hover:bg-gray-50 text-sm" href="/admin/finanzas">Finanzas</Link>
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
