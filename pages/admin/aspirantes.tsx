import LayoutAdmin from "../../components/LayoutAdmin";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Progress from "../../components/Progress";
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

const ESTADOS = ["Pendiente", "En revisión", "Aprobado", "Rechazado"];

export default function Aspirantes() {
  const empty = {
    nombre: "",
    documento: "",
    telefono: "",
    edad: "",
    experiencia: "",
    ingresos: "",
    estado: "Pendiente",
  };

  const [form, setForm] = useState<any>(empty);
  const [list, setList] = useState<Aspirante[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // modo edición
  const [editId, setEditId] = useState<number | null>(null);
  const [editCvUrl, setEditCvUrl] = useState<string | null>(null);

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
      // si se sube un nuevo archivo, lo usamos; si no, conservamos el existente (en edición)
      let cv_url: string | null = editId ? editCvUrl : null;
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

      if (editId) {
        const { error } = await supabase.from("aspirantes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aspirantes").insert(payload);
        if (error) throw error;
      }

      setForm(empty);
      setFile(null);
      setEditId(null);
      setEditCvUrl(null);
      await load();
    } catch (err: any) {
      alert("No se pudo guardar: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: Aspirante) => {
    setEditId(a.id);
    setEditCvUrl(a.cv_url || null);
    setForm({
      nombre: a.nombre || "",
      documento: a.documento || "",
      telefono: a.telefono || "",
      edad: a.edad ?? "",
      experiencia: a.experiencia || "",
      ingresos: a.ingresos ?? "",
      estado: a.estado || "Pendiente",
    });
    setFile(null); // limpiar input de archivo
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditCvUrl(null);
    setForm(empty);
    setFile(null);
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
    // optimista (refleja cambio de inmediato)
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
<div className="grid lg:grid-cols-2 gap-4 max-w-[1200px]">
        {/* FORM */}
        <Card title={editId ? "Editar aspirante" : "Nuevo aspirante"}>
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
              {editId && editCvUrl && (
                <div className="text-xs mt-1">
                  Archivo actual:{" "}
                  <a
                    className="text-brand-700 hover:underline"
                    href={editCvUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver PDF
                  </a>{" "}
                  (si subes uno nuevo, lo reemplazará)
                </div>
              )}
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Registrar"}
              </Button>
              {editId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* LISTA */}
        <Card title="Aspirantes registrados">
          {/* Controles de búsqueda y filtro */}
<div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
  <input
    placeholder="Buscar por nombre, documento o teléfono…"
    className="w-full sm:w-80 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={q}
    onChange={(e) => setQ(e.target.value)}
  />
  <select
    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={estadoFilter}
    onChange={(e) => setEstadoFilter(e.target.value)}
  >
    <option>Todos</option>
    {ESTADOS.map((s) => (
      <option key={s}>{s}</option>
    ))}
  </select>
  <button
    onClick={() => { setQ(""); setEstadoFilter("Todos"); }}
    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
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
  <tbody className="divide-y divide-gray-100">
    {rows.map((a) => (
      <tr key={a.id} className="hover:bg-gray-50/60">
        <td className="py-2 pr-4">{a.nombre}</td>
        <td className="py-2 pr-4">{a.documento}</td>
        <td className="py-2 pr-4">{a.telefono || "-"}</td>
        <td className="py-2 pr-4">
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
            value={a.estado || "Pendiente"}
            onChange={(e) => updateEstado(a.id, e.target.value)}
          >
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Badge color={estadoColor(a.estado)} className="ml-2">{a.estado || "Pendiente"}</Badge>
        </td>
        <td className="py-2 pr-4">
          {a.cv_url ? (
            <a
              href={a.cv_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
            >
              Ver PDF
            </a>
          ) : <span className="text-gray-400">—</span>}
        </td>
        <td className="py-2 pr-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm({
                nombre: a.nombre, documento: a.documento, telefono: a.telefono,
                edad: a.edad ?? "", experiencia: a.experiencia ?? "",
                ingresos: a.ingresos ?? "", estado: a.estado ?? "Pendiente"
              })}
              className="text-indigo-700 hover:underline"
            >
              Editar
            </button>
            <button onClick={() => remove(a.id)} className="text-rose-600 hover:underline">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    ))}
    {rows.length === 0 && (
      <tr>
        <td colSpan={6} className="py-6 text-center text-gray-500">Sin registros</td>
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
