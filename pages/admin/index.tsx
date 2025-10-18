import LayoutAdmin from "../../components/LayoutAdmin";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import QuickAction from "../../components/QuickAction";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type A = { id: number; nombre: string; created_at: string };
type V = { id: number; cargo: string; empresa: string | null; created_at: string };
type R = { id: number; ubicacion: string; precio: number | null; created_at: string };

export default function Panel() {
  const [stats, setStats] = useState({ aspirantes: 0, vacantes: 0, arriendos: 0 });
  const [aspRec, setAspRec] = useState<A[]>([]);
  const [vacRec, setVacRec] = useState<V[]>([]);
  const [arrRec, setArrRec] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [a, v, r, aList, vList, rList] = await Promise.all([
        supabase.from("aspirantes").select("*", { count: "exact", head: true }),
        supabase.from("vacantes").select("*", { count: "exact", head: true }),
        supabase.from("arriendos").select("*", { count: "exact", head: true }),

        supabase
          .from("aspirantes")
          .select("id,nombre,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("vacantes")
          .select("id,cargo,empresa,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("arriendos")
          .select("id,ubicacion,precio,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setStats({
        aspirantes: a.count || 0,
        vacantes: v.count || 0,
        arriendos: r.count || 0,
      });
      setAspRec((aList.data || []) as A[]);
      setVacRec((vList.data || []) as V[]);
      setArrRec((rList.data || []) as R[]);
      setLoading(false);
    })();
  }, []);

  return (
    <LayoutAdmin title="Panel">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Aspirantes" value={stats.aspirantes} subtitle="Registrados" href="/admin/aspirantes" />
        <StatCard title="Vacantes" value={stats.vacantes} subtitle="Publicadas" href="/admin/vacantes" />
        <StatCard title="Arriendos" value={stats.arriendos} subtitle="Disponibles" href="/admin/arriendos" />
      </div>

      {/* Acciones rápidas */}
      <Card
        title="Acciones rápidas"
        actions={
          <Link href="/admin/finanzas" className="text-sm text-brand-700 hover:underline">
            Ver finanzas
          </Link>
        }
      >
        <div className="flex flex-wrap gap-3">
          <QuickAction href="/admin/aspirantes">+ Nuevo aspirante</QuickAction>
          <QuickAction href="/admin/vacantes">+ Nueva vacante</QuickAction>
          <QuickAction href="/admin/arriendos">+ Nuevo arriendo</QuickAction>
        </div>
      </Card>

      {/* Listas recientes */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Aspirantes recientes">
          {loading ? (
            <div className="text-sm text-gray-500">Cargando…</div>
          ) : (
            <ul className="divide-y">
              {aspRec.map((a) => (
                <li key={a.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="truncate">{a.nombre}</span>
                  <Link href="/admin/aspirantes" className="text-brand-700 hover:underline text-xs">
                    ver
                  </Link>
                </li>
              ))}
              {aspRec.length === 0 && <li className="py-2 text-sm text-gray-500">Sin registros</li>}
            </ul>
          )}
        </Card>

        <Card title="Vacantes recientes">
          {loading ? (
            <div className="text-sm text-gray-500">Cargando…</div>
          ) : (
            <ul className="divide-y">
              {vacRec.map((v) => (
                <li key={v.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="truncate">
                    {v.cargo} {v.empresa ? `— ${v.empresa}` : ""}
                  </span>
                  <Link href="/admin/vacantes" className="text-brand-700 hover:underline text-xs">
                    ver
                  </Link>
                </li>
              ))}
              {vacRec.length === 0 && <li className="py-2 text-sm text-gray-500">Sin registros</li>}
            </ul>
          )}
        </Card>

        <Card title="Arriendos recientes">
          {loading ? (
            <div className="text-sm text-gray-500">Cargando…</div>
          ) : (
            <ul className="divide-y">
              {arrRec.map((r) => (
                <li key={r.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="truncate">{r.ubicacion}</span>
                  <span className="text-xs text-gray-500">
                    {r.precio ? `${r.precio.toLocaleString()} COP` : "-"}
                  </span>
                </li>
              ))}
              {arrRec.length === 0 && <li className="py-2 text-sm text-gray-500">Sin registros</li>}
            </ul>
          )}
        </Card>
      </div>
    </LayoutAdmin>
  );
}
