import LayoutAdmin from "../../components/LayoutAdmin";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { supabase } from "../../lib/supabase";
import { useEffect, useMemo, useState } from "react";

type Arriendo = {
  id: number;
  ubicacion: string;
  precio: number | null;
  tipo: string;
  contacto: string;
  notas: string | null;
  imagenes: string[];   // URLs públicas
  created_at: string;
};

const BUCKET = "arriendos";

// Extrae el path interno del bucket desde una URL pública de Supabase
const publicUrlToPath = (url: string) => {
  // https://xyz.supabase.co/storage/v1/object/public/arriendos/<path>
  const i = url.indexOf(`${BUCKET}/`);
  return i >= 0 ? url.slice(i + BUCKET.length + 1) : url;
};

export default function Arriendos() {
  const empty = {
    ubicacion: "",
    precio: "",
    tipo: "",
    contacto: "",
    notas: "",
  };

  const [form, setForm] = useState<any>(empty);
  const [list, setList] = useState<Arriendo[]>([]);
  const [saving, setSaving] = useState(false);

  // Crear: fotos nuevas (previews en el form)
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Editar arriendo (datos)
  const [editId, setEditId] = useState<number | null>(null);

  // Galería modal
  const [galleryId, setGalleryId] = useState<number | null>(null);
  const galleryItem = useMemo(
    () => list.find((x) => x.id === galleryId) || null,
    [galleryId, list]
  );
  // Agregar fotos desde modal
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("arriendos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setList((data || []) as Arriendo[]);
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------- Subidas ----------------

  const uploadMany = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const f of files) {
        const safe = f.name.replace(/\s+/g, "_");
        const path = `listing/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}_${safe}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, {
          cacheControl: "3600",
          upsert: false,
          contentType: f.type || "image/jpeg",
        });
        if (up.error) throw up.error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const uploadManyInGallery = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    setGalleryUploading(true);
    const urls: string[] = [];
    try {
      for (const f of files) {
        const safe = f.name.replace(/\s+/g, "_");
        const path = `listing/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}_${safe}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, {
          cacheControl: "3600",
          upsert: false,
          contentType: f.type || "image/jpeg",
        });
        if (up.error) throw up.error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      return urls;
    } finally {
      setGalleryUploading(false);
    }
  };

  // ------------- Crear / Editar -------------

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ubicacion?.trim()) return alert("La ubicación es obligatoria");

    setSaving(true);
    try {
      const imagenes = await uploadMany(files);

      const payload = {
        ubicacion: form.ubicacion,
        precio: form.precio ? Number(form.precio) : null,
        tipo: form.tipo || "",
        contacto: form.contacto || "",
        notas: form.notas || null,
        // en edición se conservan fotos anteriores
        imagenes: editId
          ? [...(list.find((x) => x.id === editId)?.imagenes || []), ...imagenes]
          : imagenes,
      };

      if (editId) {
        const { error } = await supabase
          .from("arriendos")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("arriendos").insert(payload);
        if (error) throw error;
      }

      setForm(empty);
      setFiles([]);
      setEditId(null);
      await load();
    } catch (err: any) {
      alert("No se pudo guardar: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: Arriendo) => {
    setForm({
      ubicacion: a.ubicacion || "",
      precio: a.precio ?? "",
      tipo: a.tipo || "",
      contacto: a.contacto || "",
      notas: a.notas || "",
    });
    setFiles([]);
    setEditId(a.id);
    setGalleryId(null);
  };

  const cancelEdit = () => {
    setForm(empty);
    setFiles([]);
    setEditId(null);
  };

  // ----------- Eliminar arriendo ------------

  const removeFromBucket = async (urls: string[]) => {
    if (!urls?.length) return;
    // Convertimos a paths internos
    const paths = urls.map(publicUrlToPath);
    await supabase.storage.from(BUCKET).remove(paths);
  };

  const remove = async (id: number) => {
    const target = list.find((x) => x.id === id);
    if (!target) return;
    if (!confirm("¿Eliminar arriendo y todas sus fotos?")) return;

    // 1) eliminar las fotos del bucket (opcional, pero recomendado)
    try {
      await removeFromBucket(target.imagenes || []);
    } catch (e) {
      // si falla, igual intentamos borrar el registro
      console.warn("No se pudieron eliminar algunas fotos:", e);
    }

    // 2) eliminar el registro
    const { error } = await supabase.from("arriendos").delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar: " + error.message);
      return;
    }
    await load();
  };

  // ------------- Galería (modal) ------------

  const openGallery = (id: number) => {
    setGalleryId(id);
    setGalleryFiles([]);
  };

  const closeGallery = () => {
    setGalleryId(null);
    setGalleryFiles([]);
  };

  const addPhotosToGallery = async () => {
    if (!galleryItem || galleryFiles.length === 0) return;
    try {
      const urls = await uploadManyInGallery(galleryFiles);
      const updated = [...(galleryItem.imagenes || []), ...urls];
      const { error } = await supabase
        .from("arriendos")
        .update({ imagenes: updated })
        .eq("id", galleryItem.id);
      if (error) throw error;
      setGalleryFiles([]);
      await load();
    } catch (e: any) {
      alert("No se pudo agregar fotos: " + (e.message || e));
    }
  };

  const removePhotoFromGallery = async (url: string) => {
    if (!galleryItem) return;
    if (!confirm("¿Eliminar esta foto?")) return;

    // 1) borrar del bucket
    try {
      await supabase.storage.from(BUCKET).remove([publicUrlToPath(url)]);
    } catch (e) {
      console.warn("No se pudo eliminar del bucket:", e);
    }

    // 2) actualizar arreglo en DB
    const remaining = (galleryItem.imagenes || []).filter((u) => u !== url);
    const { error } = await supabase
      .from("arriendos")
      .update({ imagenes: remaining })
      .eq("id", galleryItem.id);
    if (error) {
      alert("No se pudo actualizar el arriendo: " + error.message);
      return;
    }
    await load();
  };

  // Previews del form crear/editar
  const previews = files.map((f) => URL.createObjectURL(f));

  return (
    <LayoutAdmin title="Arriendos">
<div className="grid lg:grid-cols-2 gap-4 max-w-[1200px]">
        {/* FORM */}
        <Card title={editId ? "Editar arriendo" : "Nuevo arriendo"}>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Ubicación *</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Precio (COP)</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Tipo</label>
              <input
                placeholder="Apartamento / Habitación / Casa…"
                className="w-full border rounded-md px-3 py-2"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
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

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Notas</label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">
                {editId ? "Fotos nuevas (opcional)" : "Fotos (máx. 10 · JPG/PNG)"}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full border rounded-md px-3 py-2"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  const limited = selected.slice(0, 10);
                  setFiles(limited);
                }}
              />
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        className="w-full h-28 object-cover rounded-lg border"
                        alt={`foto-${i}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {(uploading || saving) && (
                <p className="mt-2 text-sm text-gray-500">Procesando…</p>
              )}
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Guardando…" : editId ? "Guardar cambios" : "Registrar arriendo"}
              </Button>
              {editId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* LISTA */}
        <Card title="Arriendos publicados">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Foto</th>
                  <th className="py-2 pr-4">Ubicación</th>
                  <th className="py-2 pr-4">Precio</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Contacto</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4">
                      {a.imagenes?.length ? (
                        <img
                          src={a.imagenes[0]}
                          alt="miniatura"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{a.ubicacion}</td>
                    <td className="py-2 pr-4">
                      {a.precio ? a.precio.toLocaleString() : "-"}
                    </td>
                    <td className="py-2 pr-4">{a.tipo || "-"}</td>
                    <td className="py-2 pr-4">{a.contacto || "-"}</td>
                    <td className="py-2 pr-4 whitespace-nowrap flex gap-3">
                      <button
                        onClick={() => openGallery(a.id)}
                        className="text-indigo-700 hover:underline"
                      >
                        Ver galería
                      </button>
                      <button
                        onClick={() => startEdit(a)}
                        className="text-brand-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
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

      {/* MODAL GALERÍA */}
      {galleryItem && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeGallery}
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  Galería — <span className="text-gray-600">{galleryItem.ubicacion}</span>
                </h3>
                <button
                  onClick={closeGallery}
                  className="text-gray-500 hover:text-gray-800"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Grid de fotos */}
              {galleryItem.imagenes?.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryItem.imagenes.map((url) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        className="w-full h-40 object-cover rounded-lg border"
                        alt="foto"
                      />
                      <button
                        onClick={() => removePhotoFromGallery(url)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white/90 border rounded-full w-8 h-8 grid place-items-center"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin fotos aún.</p>
              )}

              {/* Agregar más fotos */}
              <div className="mt-5 border-t pt-4">
                <label className="text-sm text-gray-600">Agregar fotos</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setGalleryFiles(Array.from(e.target.files || []).slice(0, 15))
                    }
                    className="border rounded-md px-3 py-2"
                  />
                  <Button
                    type="button"
                    disabled={galleryUploading || galleryFiles.length === 0}
                    onClick={addPhotosToGallery}
                  >
                    {galleryUploading ? "Subiendo…" : "Añadir"}
                  </Button>
                </div>
                {galleryFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {galleryFiles.length} archivo(s) seleccionados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  );
}
