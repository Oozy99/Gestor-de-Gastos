import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign,
  PieChart,
  Edit2,
  X,
  Wallet,
  AlertCircle,
} from 'lucide-react';

const ExpenseTrackerApp = () => {
  const [currentUser, setCurrentUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── LOGIN STATE ──────────────────────────────────────────────────────────────
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMode, setLoginMode] = useState('login'); // 'login' | 'register'
  const [loginError, setLoginError] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPassword2, setRegisterPassword2] = useState('');

  const [activeTab, setActiveTab] = useState('fijos');
  const [categories, setCategories] = useState([
    'Transporte',
    'Vivienda',
    'Alimentación',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Otros',
  ]);
  const [newCategory, setNewCategory] = useState('');

  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);

  // MEJORA 2: Sin campo "cuenta"
  const [newFixed, setNewFixed] = useState({
    servicio: '',
    categoria: 'Transporte',
    precio: '',
    frecuencia: 'mensual',
    fechaRenovacion: '',
  });

  const [newGeneral, setNewGeneral] = useState({
    descripcion: '',
    precio: '',
    mes: new Date().toLocaleString('es', { month: 'long' }),
    fecha: new Date().toISOString().split('T')[0],
    año: new Date().getFullYear(),
  });

  const [filterMonth, setFilterMonth] = useState('todos');
  const [filterYear, setFilterYear] = useState('todos');

  const [editingFixed, setEditingFixed] = useState(null);
  const [editingGeneral, setEditingGeneral] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const [salary, setSalary] = useState({
    monto: '',
    frecuencia: 'mensual',
    fechaPago: new Date().toISOString().split('T')[0],
  });
  const [salaries, setSalaries] = useState([]);

  // ── MEJORA 1: HELPERS — user DB en localStorage ──────────────────────────────
  const getUsersDB = () => {
    try {
      return JSON.parse(localStorage.getItem('gestor_users') || '{}');
    } catch {
      return {};
    }
  };
  const saveUsersDB = (db) => localStorage.setItem('gestor_users', JSON.stringify(db));

  // ── AUTH HANDLERS ────────────────────────────────────────────────────────────
  const handleLogin = () => {
    setLoginError('');
    const uname = loginUsername.trim().toLowerCase();
    if (!uname || !loginPassword) { setLoginError('Completa todos los campos.'); return; }
    const db = getUsersDB();
    if (!db[uname]) { setLoginError('Usuario no encontrado. ¿Quieres registrarte?'); return; }
    if (db[uname] !== loginPassword) { setLoginError('Contraseña incorrecta.'); return; }
    setCurrentUser(uname);
    setIsLoggedIn(true);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleRegister = () => {
    setLoginError('');
    const uname = registerUsername.trim().toLowerCase();
    if (!uname || !registerPassword || !registerPassword2) { setLoginError('Completa todos los campos.'); return; }
    if (registerPassword !== registerPassword2) { setLoginError('Las contraseñas no coinciden.'); return; }
    if (registerPassword.length < 4) { setLoginError('La contraseña debe tener al menos 4 caracteres.'); return; }
    const db = getUsersDB();
    if (db[uname]) { setLoginError('Ese usuario ya existe.'); return; }
    db[uname] = registerPassword;
    saveUsersDB(db);
    setCurrentUser(uname);
    setIsLoggedIn(true);
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterPassword2('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setFixedExpenses([]);
    setGeneralExpenses([]);
    setSalaries([]);
    setLoginMode('login');
    setLoginError('');
  };

  // Carga desde localStorage (por usuario)
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const fixed = localStorage.getItem(`fixed_${currentUser}`);
    const general = localStorage.getItem(`general_${currentUser}`);
    const cats = localStorage.getItem(`categories_${currentUser}`);
    const sals = localStorage.getItem(`salaries_${currentUser}`);
    if (fixed) setFixedExpenses(JSON.parse(fixed));
    if (general) setGeneralExpenses(JSON.parse(general));
    if (cats) setCategories(JSON.parse(cats));
    if (sals) setSalaries(JSON.parse(sals));
  }, [isLoggedIn, currentUser]);

  // Guardado en localStorage (por usuario)
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    localStorage.setItem(`fixed_${currentUser}`, JSON.stringify(fixedExpenses));
    localStorage.setItem(`general_${currentUser}`, JSON.stringify(generalExpenses));
    localStorage.setItem(`categories_${currentUser}`, JSON.stringify(categories));
    localStorage.setItem(`salaries_${currentUser}`, JSON.stringify(salaries));
  }, [fixedExpenses, generalExpenses, categories, salaries, isLoggedIn, currentUser]);

  const calculateDaysRemaining = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diff = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const calculateNextRenewal = (currentDate, frequency) => {
    const date = new Date(currentDate);
    if (frequency === 'quincenal') {
      date.setDate(date.getDate() + 15);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const addFixedExpense = () => {
    if (!newFixed.servicio || !newFixed.precio || !newFixed.fechaRenovacion) return;
    const precio = parseFloat(newFixed.precio);
    const costoQuincenal = newFixed.frecuencia === 'quincenal' ? precio : 0;
    const costoMensual = newFixed.frecuencia === 'mensual' ? precio : precio * 2;
    const costoAnual = costoMensual * 12;
    const proximaRenovacion = calculateNextRenewal(newFixed.fechaRenovacion, newFixed.frecuencia);
    const diasRestantes = calculateDaysRemaining(proximaRenovacion);

    if (editingFixed) {
      const updatedExpenses = fixedExpenses.map((exp) =>
        exp.id === editingFixed.id
          ? { ...exp, ...newFixed, precio, costoQuincenal, costoMensual, costoAnual, proximaRenovacion, diasRestantes }
          : exp
      );
      setFixedExpenses(updatedExpenses.sort((a, b) => new Date(a.fechaRenovacion) - new Date(b.fechaRenovacion)));
      setEditingFixed(null);
    } else {
      const expense = { id: Date.now(), ...newFixed, precio, costoQuincenal, costoMensual, costoAnual, proximaRenovacion, diasRestantes };
      setFixedExpenses([...fixedExpenses, expense].sort((a, b) => new Date(a.fechaRenovacion) - new Date(b.fechaRenovacion)));
    }

    setNewFixed({ servicio: '', categoria: 'Transporte', precio: '', frecuencia: 'mensual', fechaRenovacion: '' });
  };

  const addGeneralExpense = () => {
    if (!newGeneral.descripcion || !newGeneral.precio) return;

    if (editingGeneral) {
      const updatedExpenses = generalExpenses.map((exp) =>
        exp.id === editingGeneral.id ? { ...exp, ...newGeneral, precio: parseFloat(newGeneral.precio) } : exp
      );
      setGeneralExpenses(updatedExpenses.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setEditingGeneral(null);
    } else {
      const expense = { id: Date.now(), ...newGeneral, precio: parseFloat(newGeneral.precio) };
      setGeneralExpenses([...generalExpenses, expense].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    }

    const currentDate = new Date();
    setNewGeneral({
      descripcion: '',
      precio: '',
      mes: currentDate.toLocaleString('es', { month: 'long' }),
      fecha: currentDate.toISOString().split('T')[0],
      año: currentDate.getFullYear(),
    });
  };

  const deleteFixedExpense = (id) => setFixedExpenses(fixedExpenses.filter((e) => e.id !== id));
  const deleteGeneralExpense = (id) => setGeneralExpenses(generalExpenses.filter((e) => e.id !== id));

  const editFixedExpense = (expense) => {
    setEditingFixed(expense);
    setNewFixed({
      servicio: expense.servicio,
      categoria: expense.categoria,
      precio: expense.precio.toString(),
      frecuencia: expense.frecuencia,
      fechaRenovacion: expense.fechaRenovacion,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editGeneralExpense = (expense) => {
    setEditingGeneral(expense);
    setNewGeneral({
      descripcion: expense.descripcion,
      precio: expense.precio.toString(),
      mes: expense.mes,
      fecha: expense.fecha,
      año: expense.año || new Date(expense.fecha).getFullYear(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingFixed(null);
    setEditingGeneral(null);
    const currentDate = new Date();
    setNewFixed({ servicio: '', categoria: 'Transporte', precio: '', frecuencia: 'mensual', fechaRenovacion: '' });
    setNewGeneral({
      descripcion: '',
      precio: '',
      mes: currentDate.toLocaleString('es', { month: 'long' }),
      fecha: currentDate.toISOString().split('T')[0],
      año: currentDate.getFullYear(),
    });
  };

  const handleMonthChange = (selectedMonth) => {
    const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const monthIndex = monthNames.indexOf(selectedMonth);
    const year = newGeneral.año || new Date().getFullYear();
    const newDate = new Date(year, monthIndex, 1);
    setNewGeneral({ ...newGeneral, mes: selectedMonth, fecha: newDate.toISOString().split('T')[0] });
  };

  const handleDateChange = (selectedDate) => {
    const date = new Date(selectedDate);
    const monthName = date.toLocaleString('es', { month: 'long' });
    const year = date.getFullYear();
    setNewGeneral({ ...newGeneral, fecha: selectedDate, mes: monthName, año: year });
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (editingCategory) {
      setCategories(categories.map((cat) => (cat === editingCategory ? newCategory : cat)));
      setEditingCategory(null);
    } else {
      if (categories.includes(newCategory)) { alert('Esta categoría ya existe'); return; }
      setCategories([...categories, newCategory]);
    }
    setNewCategory('');
  };

  const deleteCategory = (categoryToDelete) => {
    if (categories.length <= 1) { alert('Debes mantener al menos una categoría'); return; }
    const isUsedInFixed = fixedExpenses.some((expense) => expense.categoria === categoryToDelete);
    if (isUsedInFixed) {
      if (!window.confirm(`La categoría "${categoryToDelete}" está siendo usada en gastos fijos. ¿Estás seguro de eliminarla?`)) return;
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoryToDelete}"?`)) return;
    }
    setCategories(categories.filter((cat) => cat !== categoryToDelete));
    if (editingCategory === categoryToDelete) cancelCategoryEdit();
  };

  const editCategory = (category) => { setEditingCategory(category); setNewCategory(category); };
  const cancelCategoryEdit = () => { setEditingCategory(null); setNewCategory(''); };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const getTotalFixedMensual = () => fixedExpenses.reduce((sum, e) => sum + e.costoMensual, 0);
  const getTotalFixedAnual = () => fixedExpenses.reduce((sum, e) => sum + e.costoAnual, 0);

  // MEJORA 3: getGeneralByMonth devuelve estructura rica (mes, año, items, total)
  const getGeneralByMonth = () => {
    const byMonth = {};
    generalExpenses.forEach((e) => {
      const key = `${e.mes}__${e.año || new Date(e.fecha).getFullYear()}`;
      if (!byMonth[key]) byMonth[key] = { mes: e.mes, año: e.año || new Date(e.fecha).getFullYear(), total: 0, items: [] };
      byMonth[key].total += e.precio;
      byMonth[key].items.push(e);
    });
    const monthOrder = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return Object.values(byMonth).sort((a, b) => {
      if (b.año !== a.año) return b.año - a.año;
      return monthOrder.indexOf(b.mes) - monthOrder.indexOf(a.mes);
    });
  };

  const getExpensesByCategory = () => {
    const byCategory = {};
    fixedExpenses.forEach((e) => {
      if (!byCategory[e.categoria]) byCategory[e.categoria] = 0;
      byCategory[e.categoria] += e.costoMensual;
    });
    generalExpenses.forEach((e) => {
      const category = 'Gastos Generales';
      if (!byCategory[category]) byCategory[category] = 0;
      byCategory[category] += e.precio;
    });
    return byCategory;
  };

  const getFilteredGeneralExpenses = () => {
    return generalExpenses.filter((expense) => {
      const expenseYear = new Date(expense.fecha).getFullYear().toString();
      const monthMatch = filterMonth === 'todos' || expense.mes === filterMonth;
      const yearMatch = filterYear === 'todos' || expenseYear === filterYear;
      return monthMatch && yearMatch;
    });
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 10; year++) years.push(year);
    return years.sort((a, b) => b - a);
  };

  // ── SALARY FUNCTIONS ─────────────────────────────────────────────────────────
  const addSalary = () => {
    if (!salary.monto || !salary.fechaPago) return;
    const newSalary = { id: Date.now(), monto: parseFloat(salary.monto), frecuencia: salary.frecuencia, fechaPago: salary.fechaPago, gastosAsignados: [] };
    setSalaries([...salaries, newSalary].sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)));
    setSalary({ monto: '', frecuencia: 'mensual', fechaPago: new Date().toISOString().split('T')[0] });
  };

  const deleteSalary = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de sueldo?'))
      setSalaries(salaries.filter((s) => s.id !== id));
  };

  const calculateFixedExpensesForPeriod = (salaryDate, frequency) => {
    const startDate = new Date(salaryDate);
    const endDate = new Date(salaryDate);
    if (frequency === 'quincenal') endDate.setDate(endDate.getDate() + 15);
    else endDate.setMonth(endDate.getMonth() + 1);
    let total = 0; const details = [];
    fixedExpenses.forEach((expense) => {
      const renovationDate = new Date(expense.fechaRenovacion);
      if (renovationDate >= startDate && renovationDate <= endDate) {
        total += expense.precio;
        details.push({ servicio: expense.servicio, monto: expense.precio, fecha: expense.fechaRenovacion });
      }
    });
    return { total, details };
  };

  const calculateGeneralExpensesForPeriod = (salaryDate, frequency) => {
    const startDate = new Date(salaryDate);
    const endDate = new Date(salaryDate);
    if (frequency === 'quincenal') endDate.setDate(endDate.getDate() + 15);
    else endDate.setMonth(endDate.getMonth() + 1);
    let total = 0; const details = [];
    generalExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.fecha);
      if (expenseDate >= startDate && expenseDate <= endDate) {
        total += expense.precio;
        details.push({ descripcion: expense.descripcion, monto: expense.precio, fecha: expense.fecha });
      }
    });
    return { total, details };
  };

  // MEJORA 3: Salud financiera basada en el sueldo más reciente
  const getLatestSalaryAmount = () => (salaries.length === 0 ? 0 : salaries[0].monto);

  const getFinancialHealth = () => {
    const sueldoMensual = getLatestSalaryAmount();
    if (!sueldoMensual) return null;

    const now = new Date();
    const currentMonth = now.toLocaleString('es', { month: 'long' }).toLowerCase();
    const currentYear = now.getFullYear();

    const gastosFijosTotal = getTotalFixedMensual();
    const gastosGeneralesMes = generalExpenses
      .filter(e => e.mes === currentMonth && (e.año || new Date(e.fecha).getFullYear()) === currentYear)
      .reduce((sum, e) => sum + e.precio, 0);

    const totalGastado = gastosFijosTotal + gastosGeneralesMes;
    const disponible = sueldoMensual - totalGastado;
    const porcentajeGastado = (totalGastado / sueldoMensual) * 100;
    const porcentajeDisponible = Math.max(0, 100 - porcentajeGastado);

    let estado, colorBarra, colorTexto, emoji;
    if (porcentajeGastado <= 50) {
      estado = 'Excelente'; colorBarra = '#10b981'; colorTexto = 'text-green-600'; emoji = '✅';
    } else if (porcentajeGastado <= 70) {
      estado = 'Buena'; colorBarra = '#3b82f6'; colorTexto = 'text-blue-600'; emoji = '👍';
    } else if (porcentajeGastado <= 90) {
      estado = 'Moderada'; colorBarra = '#f59e0b'; colorTexto = 'text-yellow-600'; emoji = '⚠️';
    } else {
      estado = 'Crítica'; colorBarra = '#ef4444'; colorTexto = 'text-red-600'; emoji = '🚨';
    }

    return {
      sueldoMensual, gastosFijosTotal, gastosGeneralesMes,
      totalGastado, disponible, porcentajeGastado, porcentajeDisponible,
      estado, colorBarra, colorTexto, emoji, currentMonth, currentYear,
    };
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <DollarSign className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Gestor de Gastos</h1>
            <p className="text-gray-600 mt-2">Accede a tu espacio personal</p>
          </div>

          {/* Toggle login / register */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setLoginMode('login'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${loginMode === 'login' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setLoginMode('register'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${loginMode === 'register' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Registrarse
            </button>
          </div>

          {loginMode === 'login' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Usuario"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Ingresar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Elige un nombre de usuario"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Contraseña (mín. 4 caracteres)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={registerPassword2}
                onChange={(e) => setRegisterPassword2(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Crear cuenta
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            Los datos de cada usuario se guardan de forma independiente en este navegador.
          </p>
        </div>
      </div>
    );
  }

  const healthData = getFinancialHealth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestor de Gastos</h1>
            <p className="text-indigo-200">Usuario: {currentUser}</p>
          </div>
          <button onClick={handleLogout} className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* TABS */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {[
            { key: 'fijos', label: 'Gastos Fijos', icon: <Calendar className="inline w-5 h-5 mr-2" /> },
            { key: 'generales', label: 'Gastos Generales', icon: <DollarSign className="inline w-5 h-5 mr-2" /> },
            { key: 'seguimiento', label: 'Seguimiento', icon: <TrendingUp className="inline w-5 h-5 mr-2" /> },
            { key: 'categorias', label: 'Categorías', icon: <PieChart className="inline w-5 h-5 mr-2" /> },
            { key: 'sueldo', label: 'Gestión de Sueldo', icon: <Wallet className="inline w-5 h-5 mr-2" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: GASTOS FIJOS ── */}
        {activeTab === 'fijos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingFixed ? 'Editar Gasto Fijo' : 'Agregar Gasto Fijo'}
              </h2>
              {editingFixed && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>Editando: {editingFixed.servicio}</span>
                  <button onClick={cancelEdit} className="text-blue-700 hover:text-blue-900"><X className="w-5 h-5" /></button>
                </div>
              )}
              {/* MEJORA 2: Sin campo "Cuenta" */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Servicio"
                  value={newFixed.servicio}
                  onChange={(e) => setNewFixed({ ...newFixed, servicio: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newFixed.categoria}
                  onChange={(e) => setNewFixed({ ...newFixed, categoria: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <input
                  type="text"
                  placeholder="Precio (ej: 60000)"
                  value={newFixed.precio}
                  onChange={(e) => setNewFixed({ ...newFixed, precio: e.target.value.replace(/[^\d]/g, '') })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newFixed.frecuencia}
                  onChange={(e) => setNewFixed({ ...newFixed, frecuencia: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
                <input
                  type="date"
                  value={newFixed.fechaRenovacion}
                  onChange={(e) => setNewFixed({ ...newFixed, fechaRenovacion: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={addFixedExpense} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  {editingFixed ? <><Edit2 className="w-5 h-5" />Actualizar Gasto Fijo</> : <><Plus className="w-5 h-5" />Agregar Gasto Fijo</>}
                </button>
                {editingFixed && (
                  <button onClick={cancelEdit} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">Cancelar</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gastos Fijos Registrados</h2>
              <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Mensual</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalFixedMensual())}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Anual</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalFixedAnual())}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Servicio</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Categoría</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Precio</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">C. Quincenal</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">C. Mensual</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">C. Anual</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Próxima Renov.</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold">Días Rest.</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{expense.servicio}</td>
                        <td className="px-4 py-3">{expense.categoria}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.precio)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.costoQuincenal)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(expense.costoMensual)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.costoAnual)}</td>
                        <td className="px-4 py-3">{new Date(expense.proximaRenovacion).toLocaleDateString('es-CO')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-sm ${expense.diasRestantes < 7 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {expense.diasRestantes} días
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => editFixedExpense(expense)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteFixedExpense(expense.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fixedExpenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No hay gastos fijos registrados aún.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: GASTOS GENERALES ── */}
        {activeTab === 'generales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingGeneral ? 'Editar Gasto General' : 'Agregar Gasto General'}
              </h2>
              {editingGeneral && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>Editando: {editingGeneral.descripcion}</span>
                  <button onClick={cancelEdit} className="text-blue-700 hover:text-blue-900"><X className="w-5 h-5" /></button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Descripción (ej. Farmacia)"
                  value={newGeneral.descripcion}
                  onChange={(e) => setNewGeneral({ ...newGeneral, descripcion: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Precio (ej: 12700)"
                  value={newGeneral.precio}
                  onChange={(e) => setNewGeneral({ ...newGeneral, precio: e.target.value.replace(/[^\d]/g, '') })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newGeneral.mes}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newGeneral.fecha}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={addGeneralExpense} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  {editingGeneral ? <><Edit2 className="w-5 h-5" />Actualizar Gasto General</> : <><Plus className="w-5 h-5" />Agregar Gasto General</>}
                </button>
                {editingGeneral && (
                  <button onClick={cancelEdit} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">Cancelar</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gastos Generales Registrados</h2>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Mes</label>
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="todos">Todos los meses</option>
                    {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].map((m) => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Año</label>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="todos">Todos los años</option>
                    {getAvailableYears().map((year) => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="bg-indigo-50 p-3 rounded-lg w-full">
                    <p className="text-sm text-gray-600">Total Filtrado</p>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(getFilteredGeneralExpenses().reduce((sum, e) => sum + e.precio, 0))}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Descripción</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Precio</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Mes</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Fecha</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredGeneralExpenses().map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{expense.descripcion}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(expense.precio)}</td>
                        <td className="px-4 py-3 capitalize">{expense.mes}</td>
                        <td className="px-4 py-3">{new Date(expense.fecha).toLocaleDateString('es-CO')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => editGeneralExpense(expense)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteGeneralExpense(expense.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredGeneralExpenses().length === 0 && (
                  <div className="text-center py-8 text-gray-500">No hay gastos registrados para los filtros seleccionados</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SEGUIMIENTO ── */}
        {activeTab === 'seguimiento' && (
          <div className="space-y-6">

            {/* MEJORA 3a: SALUD FINANCIERA */}
            {healthData ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Salud Financiera del Mes</h2>
                <p className="text-gray-500 text-sm mb-6 capitalize">
                  Basado en {healthData.currentMonth} {healthData.currentYear} — Sueldo registrado: <span className="font-semibold text-gray-700">{formatCurrency(healthData.sueldoMensual)}</span>
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{healthData.emoji}</span>
                  <div>
                    <p className="text-sm text-gray-500">Estado financiero</p>
                    <p className={`text-2xl font-bold ${healthData.colorTexto}`}>{healthData.estado}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Sueldo</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(healthData.sueldoMensual)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Gastos Fijos</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(healthData.gastosFijosTotal)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">Generales ({healthData.currentMonth})</p>
                    <p className="text-xl font-bold text-orange-500">{formatCurrency(healthData.gastosGeneralesMes)}</p>
                  </div>
                  <div className={`${healthData.disponible >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                    <p className="text-sm text-gray-600">{healthData.disponible >= 0 ? 'Disponible' : 'Déficit'}</p>
                    <p className={`text-xl font-bold ${healthData.disponible >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(healthData.disponible))}</p>
                  </div>
                </div>

                {/* MEJORA 3b: BARRA DE NIVEL */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700">Presupuesto usado</span>
                    <span className="font-bold text-gray-800">{healthData.porcentajeGastado.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3"
                      style={{ width: `${Math.min(healthData.porcentajeGastado, 100)}%`, backgroundColor: healthData.colorBarra }}
                    >
                      {healthData.porcentajeGastado > 15 && (
                        <span className="text-xs font-bold text-white">{formatCurrency(healthData.totalGastado)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$0</span>
                    <span className="text-gray-500 font-medium">
                      Disponible: {healthData.porcentajeDisponible.toFixed(1)}% — {formatCurrency(Math.max(0, healthData.disponible))}
                    </span>
                    <span>{formatCurrency(healthData.sueldoMensual)}</span>
                  </div>
                </div>

                {healthData.disponible < 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      <span className="font-bold">¡Presupuesto excedido!</span> Gastaste {formatCurrency(Math.abs(healthData.disponible))} más de tu sueldo este mes.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <p className="text-yellow-800">Para ver tu salud financiera, registra tu sueldo en la pestaña <strong>Gestión de Sueldo</strong>.</p>
              </div>
            )}

            {/* MEJORA 3c: RESUMEN ANUAL — solo gastos fijos */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Resumen Anual</h2>
              <p className="text-gray-500 text-sm mb-6">Proyección basada en tus gastos fijos mensuales actuales</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600">Gastos Fijos Mensuales</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(getTotalFixedMensual())}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600">Proyección Anual (× 12)</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(getTotalFixedAnual())}</p>
                </div>
              </div>

              {fixedExpenses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalle por servicio</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Servicio</th>
                          <th className="px-4 py-2 text-left font-semibold">Categoría</th>
                          <th className="px-4 py-2 text-right font-semibold">Mensual</th>
                          <th className="px-4 py-2 text-right font-semibold">Anual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedExpenses.map((e) => (
                          <tr key={e.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{e.servicio}</td>
                            <td className="px-4 py-3">{e.categoria}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(e.costoMensual)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.costoAnual)}</td>
                          </tr>
                        ))}
                        <tr className="bg-indigo-50 font-bold">
                          <td colSpan="2" className="px-4 py-3">TOTAL</td>
                          <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(getTotalFixedMensual())}</td>
                          <td className="px-4 py-3 text-right text-indigo-700">{formatCurrency(getTotalFixedAnual())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {fixedExpenses.length === 0 && (
                <p className="text-center text-gray-400 py-6">No hay gastos fijos registrados aún.</p>
              )}
            </div>

            {/* MEJORA 3d: GASTOS GENERALES POR MES (detallados con accordion) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Gastos Generales por Mes</h2>
              <p className="text-gray-500 text-sm mb-6">Todos los gastos generales agrupados y detallados por mes</p>

              {getGeneralByMonth().length === 0 ? (
                <p className="text-center text-gray-400 py-6">No hay gastos generales registrados aún.</p>
              ) : (
                <div className="space-y-4">
                  {getGeneralByMonth().map((group) => (
                    <details key={`${group.mes}-${group.año}`} className="group border border-gray-200 rounded-lg overflow-hidden">
                      <summary className="cursor-pointer bg-gray-50 hover:bg-gray-100 px-5 py-4 flex justify-between items-center transition-colors list-none">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-indigo-500" />
                          <span className="font-semibold text-gray-800 capitalize">{group.mes} {group.año}</span>
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{group.items.length} registros</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-indigo-600">{formatCurrency(group.total)}</span>
                          <span className="text-gray-400 text-sm">▼</span>
                        </div>
                      </summary>
                      <div className="px-5 pb-4 pt-2 bg-white">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-500 border-b">
                              <th className="py-2 text-left font-medium">Fecha</th>
                              <th className="py-2 text-left font-medium">Descripción</th>
                              <th className="py-2 text-right font-medium">Precio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item) => (
                              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 text-gray-500">{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                                <td className="py-2">{item.descripcion}</td>
                                <td className="py-2 text-right font-semibold">{formatCurrency(item.precio)}</td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                              <td colSpan="2" className="py-2 pl-1 text-gray-700">Total del mes</td>
                              <td className="py-2 text-right text-indigo-600">{formatCurrency(group.total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>

            {/* Gastos por Categoría */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gastos por Categoría</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(getExpensesByCategory()).map(([category, total]) => (
                  <div key={category} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{category}</p>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CATEGORÍAS ── */}
        {activeTab === 'categorias' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Categorías</h2>
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-1">💡 Gestión de Categorías</p>
              <p className="text-sm">Puedes editar o eliminar cualquier categoría. Los botones azul (✏️) y rojo (🗑️) están disponibles en todas las categorías.</p>
            </div>
            {editingCategory && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                <span>✏️ Editando categoría: <strong>{editingCategory}</strong></span>
                <button onClick={cancelCategoryEdit} className="text-green-700 hover:text-green-900"><X className="w-5 h-5" /></button>
              </div>
            )}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder={editingCategory ? 'Nuevo nombre de la categoría' : 'Nombre de la nueva categoría'}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addCategory} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                {editingCategory ? <><Edit2 className="w-5 h-5" />Actualizar</> : <><Plus className="w-5 h-5" />Agregar</>}
              </button>
              {editingCategory && (
                <button onClick={cancelCategoryEdit} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">Cancelar</button>
              )}
            </div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-600">Total de categorías: {categories.length}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, index) => (
                <div key={`${cat}-${index}`} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-3 rounded-lg text-indigo-800 font-medium flex items-center justify-between hover:shadow-md transition-all">
                  <span className="flex-1">{cat}</span>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => editCategory(cat)} className="bg-blue-500 text-white hover:bg-blue-600 transition-colors p-2 rounded-md shadow-sm" title="Editar categoría"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteCategory(cat)} className="bg-red-500 text-white hover:bg-red-600 transition-colors p-2 rounded-md shadow-sm" title="Eliminar categoría"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No hay categorías registradas.</div>
            )}
          </div>
        )}

        {/* ── TAB: SUELDO ── */}
        {activeTab === 'sueldo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Nuevo Sueldo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Monto del sueldo (ej: 2500000)"
                  value={salary.monto}
                  onChange={(e) => setSalary({ ...salary, monto: e.target.value.replace(/[^\d]/g, '') })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={salary.frecuencia}
                  onChange={(e) => setSalary({ ...salary, frecuencia: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
                <input
                  type="date"
                  value={salary.fechaPago}
                  onChange={(e) => setSalary({ ...salary, fechaPago: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={addSalary} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Plus className="w-5 h-5" />Registrar Sueldo
              </button>
            </div>

            {salaries.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Historial de Sueldos</h2>
                  <p className="text-gray-600 mb-4">Total de registros: <span className="font-semibold text-indigo-600">{salaries.length}</span></p>
                </div>

                {salaries.map((salaryRecord, index) => {
                  const fixedData = calculateFixedExpensesForPeriod(salaryRecord.fechaPago, salaryRecord.frecuencia);
                  const generalData = calculateGeneralExpensesForPeriod(salaryRecord.fechaPago, salaryRecord.frecuencia);
                  const totalGastos = fixedData.total + generalData.total;
                  const saldoRestante = salaryRecord.monto - totalGastos;
                  const porcentajeGastado = (totalGastos / salaryRecord.monto) * 100;
                  const startDate = new Date(salaryRecord.fechaPago);
                  const endDate = new Date(salaryRecord.fechaPago);
                  if (salaryRecord.frecuencia === 'quincenal') endDate.setDate(endDate.getDate() + 15);
                  else endDate.setMonth(endDate.getMonth() + 1);

                  return (
                    <div key={salaryRecord.id} className={`bg-white rounded-xl shadow-md p-6 border-2 ${index === 0 ? 'border-indigo-500' : 'border-transparent'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">Sueldo {salaryRecord.frecuencia}</h3>
                            {index === 0 && <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Más Reciente</span>}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-semibold">Fecha de pago:</span> {new Date(salaryRecord.fechaPago).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><span className="font-semibold">Período:</span> {startDate.toLocaleDateString('es-CO')} - {endDate.toLocaleDateString('es-CO')}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteSalary(salaryRecord.id)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50" title="Eliminar registro"><Trash2 className="w-5 h-5" /></button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Sueldo</p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(salaryRecord.monto)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Gastos Fijos</p>
                          <p className="text-2xl font-bold text-red-600">{formatCurrency(fixedData.total)}</p>
                          <p className="text-xs text-gray-500 mt-1">{((fixedData.total / salaryRecord.monto) * 100).toFixed(1)}% del sueldo</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Gastos Generales</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(generalData.total)}</p>
                          <p className="text-xs text-gray-500 mt-1">{((generalData.total / salaryRecord.monto) * 100).toFixed(1)}% del sueldo</p>
                        </div>
                        <div className={`${saldoRestante >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                          <p className="text-sm text-gray-600">Saldo Final</p>
                          <p className={`text-2xl font-bold ${saldoRestante >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(saldoRestante)}</p>
                          <p className="text-xs text-gray-500 mt-1">{saldoRestante >= 0 ? 'Superávit' : 'Déficit'}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Porcentaje de Gastos</span>
                          <span className="text-sm font-bold text-gray-900">{porcentajeGastado.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${porcentajeGastado > 100 ? 'bg-red-500' : porcentajeGastado > 80 ? 'bg-orange-500' : porcentajeGastado > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
                          >
                            {porcentajeGastado > 10 && <span className="text-xs font-bold text-white">{formatCurrency(totalGastos)}</span>}
                          </div>
                        </div>
                      </div>

                      {porcentajeGastado > 100 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-800">¡Presupuesto Excedido!</p>
                            <p className="text-sm text-red-700 mt-1">Se gastaron {formatCurrency(totalGastos - salaryRecord.monto)} más del sueldo disponible.</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Distribución de Gastos</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Gastos Fijos', total: fixedData.total, color: 'bg-red-500' },
                              { label: 'Gastos Generales', total: generalData.total, color: 'bg-orange-500' },
                              { label: saldoRestante >= 0 ? 'Disponible' : 'Déficit', total: Math.abs(saldoRestante), color: saldoRestante >= 0 ? 'bg-green-500' : 'bg-red-500' },
                            ].map((item) => (
                              <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600">{item.label}</span>
                                  <span className="font-semibold">{formatCurrency(item.total)} <span className="text-xs text-gray-400">({((item.total / salaryRecord.monto) * 100).toFixed(1)}%)</span></span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                  <div className={`${item.color} h-4 rounded-full transition-all`} style={{ width: `${Math.min((item.total / salaryRecord.monto) * 100, 100)}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Resumen Visual</h4>
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
                            <div className="text-center mb-4">
                              <svg className="w-32 h-32 mx-auto" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={porcentajeGastado > 100 ? '#EF4444' : porcentajeGastado > 80 ? '#F97316' : '#10B981'} strokeWidth="3" strokeDasharray={`${Math.min(porcentajeGastado, 100)}, 100`} />
                                <text x="18" y="20.35" fill="currentColor" textAnchor="middle" style={{ fontSize: '7px', fontWeight: 'bold' }}>{porcentajeGastado.toFixed(0)}%</text>
                              </svg>
                            </div>
                            <p className="text-center text-sm text-gray-600 font-medium">
                              {porcentajeGastado > 100 ? '⚠️ Presupuesto excedido' : porcentajeGastado > 80 ? '🔶 Cerca del límite' : porcentajeGastado > 50 ? '🟡 Mitad del presupuesto' : '✅ Buen manejo'}
                            </p>
                            <div className="mt-4 pt-4 border-t border-indigo-200">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Total Gastos:</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(totalGastos)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <span>Total Sueldo:</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(salaryRecord.monto)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <details className="group">
                        <summary className="cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 rounded-lg font-semibold text-gray-700 transition-colors flex justify-between items-center">
                          <span>📋 Ver Detalles de Gastos del Período</span>
                          <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-red-500" />Gastos Fijos ({fixedData.details.length})</h4>
                            {fixedData.details.length > 0 ? (
                              <div className="bg-red-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                                {fixedData.details.map((detail, idx) => (
                                  <div key={idx} className="flex justify-between items-start text-sm bg-white p-2 rounded">
                                    <div><p className="font-medium text-gray-700">{detail.servicio}</p><p className="text-xs text-gray-500">{new Date(detail.fecha).toLocaleDateString('es-CO')}</p></div>
                                    <span className="font-semibold text-red-600">{formatCurrency(detail.monto)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold bg-white p-2 rounded border-t-2 border-red-200">
                                  <span>Subtotal:</span><span className="text-red-600">{formatCurrency(fixedData.total)}</span>
                                </div>
                              </div>
                            ) : <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">Sin gastos fijos en este período</div>}
                          </div>
                          <div>
                            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-orange-500" />Gastos Generales ({generalData.details.length})</h4>
                            {generalData.details.length > 0 ? (
                              <div className="bg-orange-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                                {generalData.details.map((detail, idx) => (
                                  <div key={idx} className="flex justify-between items-start text-sm bg-white p-2 rounded">
                                    <div><p className="font-medium text-gray-700">{detail.descripcion}</p><p className="text-xs text-gray-500">{new Date(detail.fecha).toLocaleDateString('es-CO')}</p></div>
                                    <span className="font-semibold text-orange-600">{formatCurrency(detail.monto)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold bg-white p-2 rounded border-t-2 border-orange-200">
                                  <span>Subtotal:</span><span className="text-orange-600">{formatCurrency(generalData.total)}</span>
                                </div>
                              </div>
                            ) : <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">Sin gastos generales en este período</div>}
                          </div>
                        </div>
                        <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Total del Período:</span>
                          <span className="text-2xl font-bold text-indigo-600">{formatCurrency(totalGastos)}</span>
                        </div>
                      </details>

                      {index < salaries.length - 1 && (() => {
                        const prev = salaries[index + 1];
                        const prevFixed = calculateFixedExpensesForPeriod(prev.fechaPago, prev.frecuencia);
                        const prevGeneral = calculateGeneralExpensesForPeriod(prev.fechaPago, prev.frecuencia);
                        const prevTotal = prevFixed.total + prevGeneral.total;
                        const diffGastos = totalGastos - prevTotal;
                        const diffSueldo = salaryRecord.monto - prev.monto;
                        return (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="text-md font-semibold text-gray-800 mb-3">📊 Comparación con Período Anterior</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600 mb-1">Cambio en Sueldo</p>
                                  <p className={`font-bold text-lg ${diffSueldo > 0 ? 'text-green-600' : diffSueldo < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {diffSueldo > 0 ? '↗' : diffSueldo < 0 ? '↘' : '→'} {formatCurrency(Math.abs(diffSueldo))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Cambio en Gastos</p>
                                  <p className={`font-bold text-lg ${diffGastos < 0 ? 'text-green-600' : diffGastos > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {diffGastos > 0 ? '↗' : diffGastos < 0 ? '↘' : '→'} {formatCurrency(Math.abs(diffGastos))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Tendencia</p>
                                  <p className="font-bold text-lg text-indigo-600">
                                    {diffGastos < 0 && diffSueldo >= 0 ? '✅ Mejorando' : diffGastos > 0 && diffSueldo <= 0 ? '⚠️ Empeorando' : '➡️ Estable'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-2xl font-bold mb-4">📈 Estadísticas Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Sueldo Promedio</p>
                      <p className="text-2xl font-bold">{formatCurrency(salaries.reduce((sum, s) => sum + s.monto, 0) / salaries.length)}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Gasto Promedio</p>
                      <p className="text-2xl font-bold">{formatCurrency(salaries.reduce((sum, s) => { const f = calculateFixedExpensesForPeriod(s.fechaPago, s.frecuencia); const g = calculateGeneralExpensesForPeriod(s.fechaPago, s.frecuencia); return sum + f.total + g.total; }, 0) / salaries.length)}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Ahorro Promedio</p>
                      <p className="text-2xl font-bold">{formatCurrency(salaries.reduce((sum, s) => { const f = calculateFixedExpensesForPeriod(s.fechaPago, s.frecuencia); const g = calculateGeneralExpensesForPeriod(s.fechaPago, s.frecuencia); return sum + (s.monto - f.total - g.total); }, 0) / salaries.length)}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Períodos Registrados</p>
                      <p className="text-2xl font-bold">{salaries.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No hay sueldos registrados</h3>
                <p className="text-gray-600">Registra tu primer sueldo arriba para comenzar a llevar control de tus finanzas.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTrackerApp;