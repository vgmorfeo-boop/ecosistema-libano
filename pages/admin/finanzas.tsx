import LayoutAdmin from "../../components/LayoutAdmin";
import { useState } from 'react'

export default function Finanzas() {
  const [ingresos, setIngresos] = useState('')
  const [cuota, setCuota] = useState<number | null>(null)

  const calcular = (e: React.FormEvent) => {
    e.preventDefault()
    const i = Number(ingresos || 0)
    // Regla simple: cuota recomendable = 25% de ingresos
    setCuota(i ? Math.round(i * 0.25) : 0)
  }

  return (
    <LayoutAdmin>
      <h1 className="text-2xl font-semibold mb-4">Capacidad de pago</h1>
      <form onSubmit={calcular} className="bg-white rounded-2xl border p-4 grid md:grid-cols-6 gap-3 mb-6">
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Ingresos mensuales (COP)" value={ingresos} onChange={e=>setIngresos(e.target.value)} />
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded px-4 py-2">Calcular</button>
      </form>

      {cuota !== null && (
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-lg">Cuota mensual recomendada: <span className="font-semibold">{cuota?.toLocaleString()} COP</span></p>
          <p className="text-sm text-gray-500 mt-2">(Regla del 25% de los ingresos. Podemos migrar aquí tu Calculadora Financiera completa.)</p>
        </div>
      )}
    </LayoutAdmin>
  )
}
