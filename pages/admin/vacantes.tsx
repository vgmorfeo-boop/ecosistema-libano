import LayoutAdmin from "../../components/LayoutAdmin";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Progress from "../../components/Progress";
import { supabase } from "../../lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { estadoColor } from "../../lib/ui";

type Vacante = {
  id: number;
  cargo: string;
  empresa: string | null;
  salario: number | null;
  descripcion: string;
  requisitos: string | null;
  contacto: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
};

type Aspirante = {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  edad: number | null;
  experiencia: string | null;
  ingresos: number | null;
  estado: string | null;
  cv_url: string | null;
};

type VacanteForm = {
  cargo: string;
  empresa: string;
  salario: string | number;
  descripcion: string;
  requisitos: string;
  contacto: string;
  fecha_inicio: string;
  fecha_fin: string;
};

export default function Vacantes() {
  const empty: VacanteForm = {
    cargo: "",
    empresa: "",
    salario: "",
    descripcion: "",
    requisitos: "",
    contacto: "",
    fecha_inicio: "",
    fecha_fin: "",
  };

  const [form, setForm] = useState<VacanteForm>(empty);
  const [list, setList] = useState<Vacante[]>([]);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // matching UI
  const [matchOpenFor, setMatchOpenFor] = useState<number | null>(null);
  const [matches, setMatches] = useState<Array<{ asp: Aspirante; score: number }>>([]);
  const selectedVacante = useMemo(
    () => list.find((v) => v.id === matchOpenFor) || null,
    [matchOpenFor, list]
  );

  const load = async () => {
    const { data } = await supabase
      .from("vacantes")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data || []) as Vacante[]);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    if (!form.cargo?.trim()) return "El cargo es obligatorio";
    if (!form.descripcion?.trim()) return "La descripción es obligatoria";
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      return "La fecha final no puede ser menor a la fecha de inicio";
    }
    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    setSaving(true);

    const payload = {
      cargo: form.cargo,
      empresa: form.empresa || null,
      salario: form.salario ? Number(form.salario) : null,
      descripcion: form.descripcion || "",
      requisitos: form.requisitos || null,
      contacto: form.contacto || "",
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    };

    try {
      if (editId) {
        const { error } = await supabase.from("vacantes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vacantes").insert(payload);
        if (error) throw error;
      }
      setForm(empty);
      setEditId(null);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (v: Vacante) => {
    setForm({
      cargo: v.cargo || "",
      empresa: v.empresa || "",
      salario: v.salario ?? "",
      descripcion: v.descripcion || "",
      requisitos: v.requisitos || "",
      contacto: v.contacto || "",
      fecha_inicio: v.fecha_inicio || "",
      fecha_fin: v.fecha_fin || "",
    });
    setEditId(v.id);
    setMatchOpenFor(null);
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar esta vacante?")) return;
    await supabase.from("vacantes").delete().eq("id", id);
    await load();
  };

  // --- MATCHING --------------------------------------------------------------

  const norm = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenize = (s: string) =>
    norm(s)
      .split(" ")
      .filter((w) => w && w.length > 2);

  const scoreAspirante = (v: Vacante, a: Aspirante) => {
    const vacTokens = new Set([
      ...tokenize(v.cargo || ""),
      ...tokenize(v.descripcion || ""),
      ...tokenize(v.requisitos || ""),
    ]);

    const aspText = [a.experiencia || "", a.nombre || ""].join(" ");
    const aspTokens = new Set(tokenize(aspText));

    let hits = 0;
    vacTokens.forEach((t) => {
      if (aspTokens.has(t)) hits++;
    });

    const base = vacTokens.size > 0 ? hits / vacTokens.size : 0;

    let bonus = 0;
    if (v.salario && a.ingresos != null && v.salario >= a.ingresos) bonus += 0.05;

    return Math.max(0, Math.min(1, base + bonus));
  };

  const sugerirAspirantes = async (vac: Vacante) => {
    const { data, error } = await supabase.from("aspirantes").select("*");
    if (error) {
      alert("No se pudo cargar aspirantes: " + error.message);
      return;
    }
    const arr = (data || []) as Aspirante[];
    const ranked = arr
      .map((asp) => ({ asp, score: scoreAspirante(vac, asp) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    setMatches(ranked);
    setMatchOpenFor(vac.id);
  };

  const marcarRevision = async (idAspirante: number) => {
    const { error } = await supabase.from("aspirantes").update({ estado: "En revisión" }).eq("id", idAspirante);
    if (error) return alert("No se pudo actualizar el aspirante: " + error.message);
    setMatches((m) =>
      m.map((x) => (x.asp.id === idAspirante ? { ...x, asp: { ...x.asp, estado: "En revisión" } } : x))
    );
  };

  // --------------------------------------------------------------------------

  return (
    <LayoutAdmin title="Vacantes">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* FORM */}
        <Card title={editId ? "Editar vacante" : "Nueva vacante"}>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Cargo *</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Empresa</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Salario (COP)</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={form.salario}
                onChange={(e) => setForm({ ...form, salario: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Fecha inicio</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Fecha fin</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Descripción *</label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={4}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Requisitos (palabras clave)</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Ej: atención al cliente, caja, Excel, inventarios"
                value={form.requisitos}
                onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Contacto</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.contacto}
                onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Registrar vacante"}
              </Button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(empty);
                    setEditId(null);
                  }}
                  className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* LISTA */}
        <Card title="Vacantes publicadas">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Cargo</th>
                  <th className="py-2 pr-4">Empresa</th>
                  <th className="py-2 pr-4">Salario</th>
                  <th className="py-2 pr-4">Vigencia</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((v) => {
                  const vigencia = (v.fecha_inicio || "") + (v.fecha_fin ? ` → ${v.fecha_fin}` : "");
                  return (
                    <tr key={v.id}>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{v.cargo}</div>
                      </td>
                      <td className="py-2 pr-4">{v.empresa || "-"}</td>
                      <td className="py-2 pr-4">{v.salario != null ? v.salario.toLocaleString() : "-"}</td>
                      <td className="py-2 pr-4">
                        {vigencia ? <Badge color="blue">{vigencia}</Badge> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <button className="text-indigo-700 hover:underline mr-3" onClick={() => startEdit(v)}>
                          Editar
                        </button>
                        <button className="text-red-600 hover:underline mr-3" onClick={() => remove(v.id)}>
                          Eliminar
                        </button>
                        <button className="text-brand-700 hover:underline" onClick={() => sugerirAspirantes(v)}>
                          Sugerir aspirantes
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Sin vacantes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PANEL DE MATCHING */}
          {selectedVacante && (
            <div className="mt-6 border rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  Aspirantes sugeridos para: <span className="text-brand-700">{selectedVacante.cargo}</span>
                </h3>
                <button className="text-sm text-gray-600 hover:underline" onClick={() => setMatchOpenFor(null)}>
                  Cerrar
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Aspirante</th>
                      <th className="py-2 pr-4">Teléfono</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Afinidad</th>
                      <th className="py-2 pr-4">CV</th>
                      <th className="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matches.map(({ asp, score }) => (
                      <tr key={asp.id}>
                        <td className="py-2 pr-4">
                          <div className="font-medium">{asp.nombre}</div>
                          <div className="text-gray-500 line-clamp-1 max-w-[520px]">
                            {asp.experiencia || "Sin experiencia registrada"}
                          </div>
                        </td>
                        <td className="py-2 pr-4">{asp.telefono || "-"}</td>
                        <td className="py-2 pr-4">
                          <Badge color={estadoColor(asp.estado)}>{asp.estado || "Pendiente"}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2 w-44">
                            <Progress value={Math.round(score * 100)} />
                            <span className="text-xs text-gray-700 w-10 text-right">
                              {Math.round(score * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          {asp.cv_url ? (
                            <a href={asp.cv_url} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                              Ver PDF
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <button className="text-brand-700 hover:underline" onClick={() => marcarRevision(asp.id)}>
                            Marcar “En revisión”
                          </button>
                        </td>
                      </tr>
                    ))}

                    {matches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          Usa “Sugerir aspirantes” para ver coincidencias
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </LayoutAdmin>
  );
}
