import { useState } from "react";

export default function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const categories = [
    "Alimentación",
    "Transporte",
    "Servicios",
    "Ocio",
    "Otros",
  ];

  const addExpense = () => {
    if (!description || !amount || !category) return;

    const newExpense = {
      id: Date.now(),
      description,
      amount,
      category,
    };

    setExpenses((prev) => [...prev, newExpense]);
    setDescription("");
    setAmount("");
    setCategory("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Gestor de Gastos
      </h1>

      {/* FORMULARIO */}
      <div className="bg-white shadow rounded p-4 mb-6 space-y-4">
        <input
          type="text"
          placeholder="Descripción"
          className="w-full border p-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Monto"
          className="w-full border p-2 rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="w-full border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Seleccione una categoría</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={addExpense}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Agregar gasto
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white shadow rounded p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Descripción</th>
              <th className="border p-2 text-left">Monto</th>
              <th className="border p-2 text-left">Categoría</th>
            </tr>
          </thead>

          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="border p-4 text-center text-gray-500"
                >
                  No hay registros aún
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="border p-2">{expense.description}</td>
                  <td className="border p-2">${expense.amount}</td>
                  <td className="border p-2">{expense.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
