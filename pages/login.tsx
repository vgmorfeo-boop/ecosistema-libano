import { useState } from "react";

export default function Login() {
  const [pin, setPin] = useState("");
  const expected = (process.env.NEXT_PUBLIC_ADMIN_PIN || "").trim();

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const typed = pin.trim();
    if (typed && typed === expected) {
      sessionStorage.setItem("admin_pin", typed);
      window.location.href = "/admin";
    } else {
      alert("PIN incorrecto");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={handle} className="bg-white p-8 rounded-xl shadow-[0_6px_20px_-8px_rgba(0,0,0,0.15)] border w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4 text-gray-900">Acceso administrador</h1>
        <label className="block text-sm mb-2 text-gray-700">PIN</label>
        <input
          value={pin}
          onChange={(e)=>setPin(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="1234"
          inputMode="numeric"
        />
        <button className="mt-4 w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md px-4 py-2">Entrar</button>
      </form>
    </div>
  );
}
