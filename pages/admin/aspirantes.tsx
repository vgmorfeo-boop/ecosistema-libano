import LayoutAdmin from "../../components/LayoutAdmin";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import { estadoColor } from "../../lib/ui";

type Aspirante = {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  edad: number | null;
  experiencia: string | null;
  ingresos: number | null;
  created_at: string;
  estado: string | null;
  cv_url: string | null;
};

type AspiranteForm = {
  nombre: string;
  documento: string;
  telefono: string;
  edad: string | number;
  experiencia: string;
  ingresos: string | number;
  estado: string;
};

const ESTADOS = ["Pendiente", "En revisión", "Aprobado", "Rechazado"];

export default function Aspirantes() {
  const empty: AspiranteForm = {
    nombre: "",
    documento: "",
    telefono: "",
    edad: "",
    experiencia: "",
    ingresos: "",
    estado: "Pendiente",
  };

  const [form, setForm] = useState<AspiranteForm>(empty);
  const [list, setList] = useState<Aspirante[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // búsqueda y filtro
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("Todos");

  const load = async () => {
    const { data, error } = await supabase
      .from("aspirantes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setList((data || []) as Aspirante[]);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadPDF = async (): Promise<string | null> => {
    if (!file) return null;
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `hv/${Date.now()}_${safeName}`;
    const up = await supabase.storage.from("hv").upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (up.error) {
      alert("Error subiendo PDF: " + up.error.message);
      return null;
    }
    const pub = supabase.storage.from("hv").getPublicUrl(path);
    return pub.data.publicUrl || null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    if (!form.documento?.trim()) {
      alert("El documento es obligatorio");
      return;
    }

    setSaving(true);
    try {
      let cv_url: string | null = null;
      if (file) cv_url = await uploadPDF();

      const payload = {
        nombre: form.nombre,
        documento: form.documento,
        telefono: form.telefono || "",
        edad: form.edad ? Number(form.edad) : null,
        experiencia: form.experiencia || null,
        ingresos: form.ingresos ? Number(form.ingresos) : null,
        estado: form.estado || "Pendiente",
        cv_url,
      };

      const { error } = await supabase.from("aspirantes").insert(payload);
      if (error) throw error;

      setForm(empty);
      setFile(null);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("No se pudo guardar: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar aspirante?")) return;
    const { error } = await supabase.from("aspirantes").delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar: " + error.message);
      return;
    }
    await load();
  };

  const updateEstado = async (id: number, nuevo: string) => {
    const prevList = list;
    setList((p) => p.map((a) => (a.id === id ? { ...a, estado: nuevo } : a)));

    const { error } = await supabase.from("aspirantes").update({ estado: nuevo }).eq("id", id);
    if (error) {
      alert("No se pudo cambiar el estado: " + error.message);
      setList(prevList); // revierte
    }
  };

  // filtros en memoria
  const filtra = (a: Aspirante) => {
    const hit =
      (a.nombre + " " + (a.documento || "") + " " + (a.telefono || ""))
        .toLowerCase()
        .includes(q.toLowerCase());
    const estadoOk = estadoFilter === "Todos" || (a.estado || "Pendiente") === estadoFilter;
    return hit && estadoOk;
  };
  const rows = list.filter(filtra);

  return (
    <LayoutAdmin title="Aspirantes">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* FORM */}
        <Card title="Nuevo aspirante">
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Nombre completo</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Documento</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Teléfono</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Edad</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={form.edad}
                onChange={(e) => setForm({ ...form, edad: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Ingresos mensuales</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={form.ingresos}
                onChange={(e) => setForm({ ...form, ingresos: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Experiencia (breve)</label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                value={form.experiencia}
                onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Estado</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Hoja de vida (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                className="w-full border rounded-md px-3 py-2"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Card>

        {/* LISTA */}
        <Card title="Aspirantes registrados">
          {/* Controles de búsqueda y filtro */}
          <div className="mb-3 flex flex-wrap gap-3 items-center">
            <input
              placeholder="Buscar por nombre, documento o teléfono…"
              className="border rounded-md px-3 py-2 w-full sm:w-80"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option>Todos</option>
              {ESTADOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setQ("");
                setEstadoFilter("Todos");
              }}
              className="text-sm px-3 py-2 border rounded-md bg-white hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Teléfono</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">CV</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4">{a.nombre}</td>
                    <td className="py-2 pr-4">{a.documento}</td>
                    <td className="py-2 pr-4">{a.telefono || "-"}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="border rounded-md px-2 py-1 text-xs"
                        value={a.estado || "Pendiente"}
                        onChange={(e) => updateEstado(a.id, e.target.value)}
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Badge color={estadoColor(a.estado)} className="ml-2">
                        {a.estado || "Pendiente"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">
                      {a.cv_url ? (
                        <a
                          href={a.cv_url}
                          className="text-brand-700 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => remove(a.id)} className="text-red-600 hover:underline">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Sin registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
