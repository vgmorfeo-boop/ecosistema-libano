import jsPDF from 'jspdf'

export function PDFButton({ data }: { data: any }) {
  const generate = () => {
    const doc = new jsPDF()
    const title = 'Informe de Recomendación — Ecosistema Digital del Líbano'
    doc.setFontSize(14)
    doc.text(title, 14, 18)

    const y0 = 28
    const lines = [
      `Nombre: ${data?.nombre ?? ''}`,
      `Documento: ${data?.documento ?? ''}`,
      `Empleabilidad: ${data?.empleabilidad ?? ''}`,
      `Recomendación empleo: ${data?.recomendacion_empleo ?? ''}`,
      `Rango arriendo: ${data?.rango_arriendo ?? ''}`,
      `Observaciones: ${data?.observacion ?? ''}`,
      `Fecha: ${new Date().toLocaleDateString()}`,
    ]

    let y = y0
    doc.setFontSize(11)
    lines.forEach((l) => { doc.text(l, 14, y); y += 8 })

    doc.save(`informe_${data?.documento || 'usuario'}.pdf`)
  }

  return (
    <button onClick={generate} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">
      Descargar Informe PDF
    </button>
  )
}
