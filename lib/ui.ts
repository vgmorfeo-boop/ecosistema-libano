export const estadoColor = (estado?: string) => {
  switch ((estado || "").toLowerCase()) {
    case "aprobado":     return "green";
    case "en revisión":  return "indigo";
    case "rechazado":    return "red";
    default:             return "amber"; // Pendiente
  }
};
