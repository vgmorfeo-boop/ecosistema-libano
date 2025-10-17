// lib/affinity.ts
// Algoritmo explicable: 100 puntos repartidos en bloques.
// Texto 60, Salario 15, Estado 15, Señales 10  => total 100.

const STOP_ES = new Set([
  "de","la","el","y","a","en","para","por","con","del","los","las","un","una","uno",
  "se","al","o","su","sus","como","que","es","un@","lo","ya","u","e"
]);

export type Breakdown = {
  texto: number;  // 0–60
  salario: number; // 0–15
  estado: number; // 0–15
  senales: number; // 0–10
  total: number;   // 0–100
  notas: string[]; // explicación
};

const WEIGHTS = { TEXTO: 60, SALARIO: 15, ESTADO: 15, SENALES: 10 };

export function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tildes
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(str: string): string[] {
  const base = normalize(str).split(" ").filter(Boolean);
  return base.filter(w => !STOP_ES.has(w) && w.length > 2);
}

// Jaccard simple para sets de palabras
function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return inter / union; // 0..1
}

// Mapea estado a puntos (0–15)
function scoreEstado(estado?: string | null): number {
  const e = (estado || "Pendiente").toLowerCase();
  if (e.includes("aprob")) return 15;
  if (e.includes("revision")) return 10;
  if (e.includes("pend")) return 6;
  if (e.includes("rechaz")) return 0;
  return 6;
}

// Salario: máximo puntos si ingresos <= salarioVacante; si se pasa, cae lineal hasta 0 cuando es 1.6x
function scoreSalario(ingresos?: number | null, salarioVacante?: number | null): number {
  if (!salarioVacante) return WEIGHTS.SALARIO * 0.6; // si no hay dato, damos algo
  if (!ingresos && ingresos !== 0) return WEIGHTS.SALARIO * 0.8;
  const ratio = (ingresos || 0) / salarioVacante;
  if (ratio <= 1.0) return WEIGHTS.SALARIO;
  if (ratio >= 1.6) return 0;
  const frac = 1 - (ratio - 1) / 0.6; // 1 -> 0
  return Math.max(0, WEIGHTS.SALARIO * frac);
}

// Señales 0–10: CV, teléfono
function scoreSenales(cv?: string | null, tel?: string | null): number {
  let s = 0;
  if (cv) s += 6;
  if (tel && tel.trim().length >= 7) s += 4;
  return Math.min(WEIGHTS.SENALES, s);
}

/**
 * Calcula afinidad explicable
 * @param aspirante { experiencia, nombre, ingresos, estado, telefono, cv_url }
 * @param vacante   { cargo, descripcion, salario }
 */
export function scoreAspiranteVacante(
  aspirante: {
    experiencia?: string | null;
    nombre?: string | null;
    ingresos?: number | null;
    estado?: string | null;
    telefono?: string | null;
    cv_url?: string | null;
  },
  vacante: { cargo?: string | null; descripcion?: string | null; salario?: number | null }
): Breakdown {
  const notas: string[] = [];

  // --- TEXTO (0–60)
  const vText = tokens(`${vacante.cargo || ""} ${vacante.descripcion || ""}`);
  const aText = tokens(`${aspirante.experiencia || ""} ${aspirante.nombre || ""}`);
  const sim = jaccard(vText, aText); // 0..1
  const texto = Math.round(sim * WEIGHTS.TEXTO);
  if (sim === 0) notas.push("No encontramos palabras en común entre cargo/descripcion y experiencia.");
  else notas.push(`Coincidencia de texto ${Math.round(sim*100)}% entre cargo/descripcion y experiencia.`);

  // --- SALARIO (0–15)
  const salario = Math.round(scoreSalario(aspirante.ingresos ?? null, vacante.salario ?? null));
  if (vacante.salario)
    notas.push(`Ingresos del aspirante ≈ ${aspirante.ingresos ?? "N/D"} vs salario vacante ${vacante.salario}.`);

  // --- ESTADO (0–15)
  const estado = scoreEstado(aspirante.estado);
  notas.push(`Estado del aspirante: ${aspirante.estado ?? "Pendiente"}.`);

  // --- SEÑALES (0–10)
  const senales = scoreSenales(aspirante.cv_url, aspirante.telefono);
  if (!aspirante.cv_url) notas.push("No tiene hoja de vida cargada.");
  if (!aspirante.telefono) notas.push("No hay teléfono verificado.");

  const total = Math.min(100, texto + salario + estado + senales);
  return { texto, salario, estado, senales, total, notas };
}
