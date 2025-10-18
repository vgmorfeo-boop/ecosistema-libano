// lib/ui.ts
export type BadgeColor =
  | "indigo"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray";

export const estadoColor = (estado?: string | null): BadgeColor => {
  const e = (estado ?? "").toLowerCase(); // <- maneja null/undefined
  switch (e) {
    case "aprobado":
      return "green";
    case "rechazado":
      return "red";
    case "en revisión":
    case "en revision":
      return "indigo";
    case "pendiente":
    default:
      return "yellow";
  }
};
