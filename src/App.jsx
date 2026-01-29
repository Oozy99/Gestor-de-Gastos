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
  LogOut,
  Mail,
  Lock,
  User,
  Loader,
} from 'lucide-react';

// Importar funciones de Supabase
import { 
  signUp, 
  signIn, 
  signOut, 
  onAuthStateChange 
} from './lib/auth';

import {
  getCategories,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getFixedExpenses,
  addFixedExpense as dbAddFixedExpense,
  updateFixedExpense as dbUpdateFixedExpense,
  deleteFixedExpense as dbDeleteFixedExpense,
  getGeneralExpenses,
  addGeneralExpense as dbAddGeneralExpense,
  updateGeneralExpense as dbUpdateGeneralExpense,
  deleteGeneralExpense as dbDeleteGeneralExpense,
  getSalaries,
  addSalary as dbAddSalary,
  deleteSalary as dbDeleteSalary,
} from './lib/database';

const ExpenseTrackerApp = () => {
  // ============================================
  // ESTADOS DE AUTENTICACIÓN
  // ============================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ============================================
  // ESTADOS EXISTENTES
  // ============================================
  const [activeTab, setActiveTab] = useState('fijos');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  
  const [newFixed, setNewFixed] = useState({
    servicio: '',
    categoria: 'Transporte',
    cuenta: '',
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

  // ============================================
  // HELPER: FORMATEAR FECHAS CORRECTAMENTE
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return new Date(year, parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-CO');
  };

  // ============================================
  // EFECTO: ESCUCHAR CAMBIOS DE AUTENTICACIÓN
  // ============================================
  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setCategories([]);
        setFixedExpenses([]);
        setGeneralExpenses([]);
        setSalaries([]);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ============================================
  // CARGAR DATOS DEL USUARIO
  // ============================================
  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      
      const [categoriesData, fixedData, generalData, salariesData] = await Promise.all([
        getCategories(userId),
        getFixedExpenses(userId),
        getGeneralExpenses(userId),
        getSalaries(userId),
      ]);

      setCategories(categoriesData);
      setFixedExpenses(fixedData);
      setGeneralExpenses(generalData);
      setSalaries(salariesData);
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MANEJO DE AUTENTICACIÓN
  // ============================================
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!authForm.fullName.trim()) {
          throw new Error('Por favor ingresa tu nombre completo');
        }
        if (authForm.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        await signUp(authForm.email, authForm.password, authForm.fullName);
        alert('¡Registro exitoso! Por favor revisa tu correo para verificar tu cuenta.');
        setAuthMode('login');
        setAuthForm({ email: '', password: '', fullName: '' });
      } else {
        await signIn(authForm.email, authForm.password);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setActiveTab('fijos');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error al cerrar sesión: ' + error.message);
    }
  };

  // ============================================
  // FUNCIONES DE FECHAS (CORREGIDAS)
  // ============================================
  const handleDateChange = (selectedDate) => {
    const date = new Date(selectedDate + 'T12:00:00');
    const monthName = date.toLocaleString('es', { month: 'long' });
    const year = date.getFullYear();

    setNewGeneral({
      ...newGeneral,
      fecha: selectedDate,
      mes: monthName,
      año: year,
    });
  };

  const handleMonthChange = (selectedMonth) => {
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const monthIndex = monthNames.indexOf(selectedMonth);
    const year = newGeneral.año || new Date().getFullYear();
    const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;

    setNewGeneral({
      ...newGeneral,
      mes: selectedMonth,
      fecha: formattedDate,
    });
  };

  // ============================================
  // FUNCIONES DE CÁLCULO
  // ============================================
  const calculateDaysRemaining = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate + 'T12:00:00');
    const diff = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const calculateNextRenewal = (currentDate, frequency) => {
    const date = new Date(currentDate + 'T12:00:00');
    if (frequency === 'quincenal') {
      date.setDate(date.getDate() + 15);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  // ============================================
  // GASTOS FIJOS
  // ============================================
  const addFixedExpense = async () => {
    if (!newFixed.servicio || !newFixed.precio || !newFixed.fechaRenovacion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const precio = parseFloat(newFixed.precio);
      const costoQuincenal = newFixed.frecuencia === 'quincenal' ? precio : 0;
      const costoMensual = newFixed.frecuencia === 'mensual' ? precio : precio * 2;
      const costoAnual = costoMensual * 12;
      const proximaRenovacion = calculateNextRenewal(newFixed.fechaRenovacion, newFixed.frecuencia);
      const diasRestantes = calculateDaysRemaining(proximaRenovacion);

      const expenseData = {
        servicio: newFixed.servicio,
        categoria: newFixed.categoria,
        cuenta: newFixed.cuenta,
        precio,
        frecuencia: newFixed.frecuencia,
        fechaRenovacion: newFixed.fechaRenovacion,
        costoQuincenal,
        costoMensual,
        costoAnual,
        proximaRenovacion,
        diasRestantes,
      };

      if (editingFixed) {
        await dbUpdateFixedExpense(editingFixed.id, expenseData);
        setFixedExpenses(fixedExpenses.map(exp => 
          exp.id === editingFixed.id ? { ...expenseData, id: editingFixed.id } : exp
        ).sort((a, b) => new Date(a.fechaRenovacion) - new Date(b.fechaRenovacion)));
        setEditingFixed(null);
      } else {
        const newExpense = await dbAddFixedExpense(user.id, expenseData);
        setFixedExpenses([...fixedExpenses, { ...expenseData, id: newExpense.id }]
          .sort((a, b) => new Date(a.fechaRenovacion) - new Date(b.fechaRenovacion)));
      }

      setNewFixed({
        servicio: '',
        categoria: categories[0] || 'Transporte',
        cuenta: '',
        precio: '',
        frecuencia: 'mensual',
        fechaRenovacion: '',
      });
    } catch (error) {
      console.error('Error saving fixed expense:', error);
      alert('Error al guardar el gasto fijo: ' + error.message);
    }
  };

  const deleteFixedExpense = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto fijo?')) return;

    try {
      await dbDeleteFixedExpense(id);
      setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting fixed expense:', error);
      alert('Error al eliminar el gasto fijo: ' + error.message);
    }
  };

  const editFixedExpense = (expense) => {
    setEditingFixed(expense);
    setNewFixed({
      servicio: expense.servicio,
      categoria: expense.categoria,
      cuenta: expense.cuenta,
      precio: expense.precio.toString(),
      frecuencia: expense.frecuencia,
      fechaRenovacion: expense.fechaRenovacion,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // GASTOS GENERALES
  // ============================================
  const addGeneralExpense = async () => {
    if (!newGeneral.descripcion || !newGeneral.precio) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const expenseData = {
        descripcion: newGeneral.descripcion,
        precio: parseFloat(newGeneral.precio),
        mes: newGeneral.mes,
        fecha: newGeneral.fecha,
        año: newGeneral.año,
      };

      if (editingGeneral) {
        await dbUpdateGeneralExpense(editingGeneral.id, expenseData);
        setGeneralExpenses(generalExpenses.map(exp =>
          exp.id === editingGeneral.id ? { ...expenseData, id: editingGeneral.id } : exp
        ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
        setEditingGeneral(null);
      } else {
        const newExpense = await dbAddGeneralExpense(user.id, expenseData);
        setGeneralExpenses([...generalExpenses, { ...expenseData, id: newExpense.id }]
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      }

      const currentDate = new Date();
      setNewGeneral({
        descripcion: '',
        precio: '',
        mes: currentDate.toLocaleString('es', { month: 'long' }),
        fecha: currentDate.toISOString().split('T')[0],
        año: currentDate.getFullYear(),
      });
    } catch (error) {
      console.error('Error saving general expense:', error);
      alert('Error al guardar el gasto general: ' + error.message);
    }
  };

  const deleteGeneralExpense = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto general?')) return;

    try {
      await dbDeleteGeneralExpense(id);
      setGeneralExpenses(generalExpenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting general expense:', error);
      alert('Error al eliminar el gasto general: ' + error.message);
    }
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

  // ============================================
  // CATEGORÍAS
  // ============================================
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      if (editingCategory) {
        await dbUpdateCategory(user.id, editingCategory, newCategory);
        setCategories(categories.map(cat => cat === editingCategory ? newCategory : cat));
        setEditingCategory(null);
      } else {
        if (categories.includes(newCategory)) {
          alert('Esta categoría ya existe');
          return;
        }
        await dbAddCategory(user.id, newCategory);
        setCategories([...categories, newCategory]);
      }
      setNewCategory('');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría: ' + error.message);
    }
  };

  const deleteCategory = async (categoryToDelete) => {
    if (categories.length <= 1) {
      alert('Debes mantener al menos una categoría');
      return;
    }

    const isUsedInFixed = fixedExpenses.some(expense => expense.categoria === categoryToDelete);

    if (isUsedInFixed) {
      const confirmDelete = window.confirm(
        `La categoría "${categoryToDelete}" está siendo usada en gastos fijos. ¿Estás seguro de eliminarla?`
      );
      if (!confirmDelete) return;
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoryToDelete}"?`)) return;
    }

    try {
      await dbDeleteCategory(user.id, categoryToDelete);
      setCategories(categories.filter(cat => cat !== categoryToDelete));
      if (editingCategory === categoryToDelete) {
        cancelCategoryEdit();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría: ' + error.message);
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setNewCategory(category);
  };

  const cancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCategory('');
  };

  // ============================================
  // SUELDOS
  // ============================================
  const addSalary = async () => {
    if (!salary.monto || !salary.fechaPago) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const salaryData = {
        monto: parseFloat(salary.monto),
        frecuencia: salary.frecuencia,
        fechaPago: salary.fechaPago,
      };

      const newSalary = await dbAddSalary(user.id, salaryData);
      setSalaries([...salaries, { ...salaryData, id: newSalary.id, gastosAsignados: [] }]
        .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)));

      setSalary({
        monto: '',
        frecuencia: 'mensual',
        fechaPago: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('Error al guardar el sueldo: ' + error.message);
    }
  };

  const deleteSalary = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de sueldo?')) return;

    try {
      await dbDeleteSalary(id);
      setSalaries(salaries.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting salary:', error);
      alert('Error al eliminar el sueldo: ' + error.message);
    }
  };

  // ============================================
  // FUNCIONES DE ANÁLISIS
  // ============================================
  const calculateFixedExpensesForPeriod = (salaryDate, frequency) => {
    const startDate = new Date(salaryDate + 'T12:00:00');
    const endDate = new Date(salaryDate + 'T12:00:00');

    if (frequency === 'quincenal') {
      endDate.setDate(endDate.getDate() + 15);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    let total = 0;
    const details = [];

    fixedExpenses.forEach(expense => {
      const renovationDate = new Date(expense.fechaRenovacion + 'T12:00:00');

      if (renovationDate >= startDate && renovationDate <= endDate) {
        total += expense.precio;
        details.push({
          servicio: expense.servicio,
          monto: expense.precio,
          fecha: expense.fechaRenovacion,
        });
      }
    });

    return { total, details };
  };

  const calculateGeneralExpensesForPeriod = (salaryDate, frequency) => {
    const startDate = new Date(salaryDate + 'T12:00:00');
    const endDate = new Date(salaryDate + 'T12:00:00');

    if (frequency === 'quincenal') {
      endDate.setDate(endDate.getDate() + 15);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    let total = 0;
    const details = [];

    generalExpenses.forEach(expense => {
      const expenseDate = new Date(expense.fecha + 'T12:00:00');

      if (expenseDate >= startDate && expenseDate <= endDate) {
        total += expense.precio;
        details.push({
          descripcion: expense.descripcion,
          monto: expense.precio,
          fecha: expense.fecha,
        });
      }
    });

    return { total, details };
  };

  const cancelEdit = () => {
    setEditingFixed(null);
    setEditingGeneral(null);
    const currentDate = new Date();
    setNewFixed({
      servicio: '',
      categoria: categories[0] || 'Transporte',
      cuenta: '',
      precio: '',
      frecuencia: 'mensual',
      fechaRenovacion: '',
    });
    setNewGeneral({
      descripcion: '',
      precio: '',
      mes: currentDate.toLocaleString('es', { month: 'long' }),
      fecha: currentDate.toISOString().split('T')[0],
      año: currentDate.getFullYear(),
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTotalFixedMensual = () => {
    return fixedExpenses.reduce((sum, e) => sum + e.costoMensual, 0);
  };

  const getTotalFixedAnual = () => {
    return fixedExpenses.reduce((sum, e) => sum + e.costoAnual, 0);
  };

  const getGeneralByMonth = () => {
    const byMonth = {};
    generalExpenses.forEach(e => {
      const month = e.mes;
      if (!byMonth[month]) byMonth[month] = 0;
      byMonth[month] += e.precio;
    });
    return byMonth;
  };

  const getExpensesByCategory = () => {
    const byCategory = {};
    fixedExpenses.forEach(e => {
      if (!byCategory[e.categoria]) byCategory[e.categoria] = 0;
      byCategory[e.categoria] += e.costoMensual;
    });
    generalExpenses.forEach(e => {
      const category = 'Gastos Generales';
      if (!byCategory[category]) byCategory[category] = 0;
      byCategory[category] += e.precio;
    });
    return byCategory;
  };

  const getFilteredGeneralExpenses = () => {
    return generalExpenses.filter(expense => {
      const expenseDate = new Date(expense.fecha + 'T12:00:00');
      const expenseYear = expenseDate.getFullYear().toString();

      const monthMatch = filterMonth === 'todos' || expense.mes === filterMonth;
      const yearMatch = filterYear === 'todos' || expenseYear === filterYear;

      return monthMatch && yearMatch;
    });
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a);
  };

  // ============================================
  // PANTALLA DE CARGA
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // PANTALLA DE LOGIN/REGISTRO
  // ============================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <DollarSign className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Gestor de Gastos</h1>
            <p className="text-gray-600 mt-2">
              {authMode === 'login' 
                ? 'Inicia sesión para acceder a tu cuenta' 
                : 'Crea tu cuenta para comenzar'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              {authMode === 'register' && (
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {authLoading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Procesando...
                </>
              ) : (
                authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
                setAuthForm({ email: '', password: '', fullName: '' });
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              {authMode === 'login' 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // APLICACIÓN PRINCIPAL (USUARIO AUTENTICADO)
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestor de Gastos</h1>
            <p className="text-indigo-200">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs de navegación */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab('fijos')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'fijos'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="inline w-5 h-5 mr-2" />
            Gastos Fijos
          </button>
          <button
            onClick={() => setActiveTab('generales')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'generales'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="inline w-5 h-5 mr-2" />
            Gastos Generales
          </button>
          <button
            onClick={() => setActiveTab('seguimiento')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'seguimiento'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="inline w-5 h-5 mr-2" />
            Seguimiento
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'categorias'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <PieChart className="inline w-5 h-5 mr-2" />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('sueldo')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'sueldo'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Wallet className="inline w-5 h-5 mr-2" />
            Gestión de Sueldo
          </button>
        </div>

        {/* TAB: GASTOS FIJOS */}
        {activeTab === 'fijos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingFixed ? 'Editar Gasto Fijo' : 'Agregar Gasto Fijo'}
              </h2>
              {editingFixed && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>Editando: {editingFixed.servicio}</span>
                  <button onClick={cancelEdit} className="text-blue-700 hover:text-blue-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Cuenta"
                  value={newFixed.cuenta}
                  onChange={(e) => setNewFixed({ ...newFixed, cuenta: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Precio (ej: 60000)"
                  value={newFixed.precio}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setNewFixed({ ...newFixed, precio: value });
                  }}
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
                <button
                  onClick={addFixedExpense}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {editingFixed ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Actualizar Gasto Fijo
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Agregar Gasto Fijo
                    </>
                  )}
                </button>
                {editingFixed && (
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
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
                      <th className="px-4 py-2 text-left text-sm font-semibold">Cuenta</th>
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
                        <td className="px-4 py-3">{expense.cuenta}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.precio)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.costoQuincenal)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(expense.costoMensual)}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(expense.costoAnual)}</td>
                        <td className="px-4 py-3">{formatDate(expense.proximaRenovacion)}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              expense.diasRestantes < 7
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {expense.diasRestantes} días
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => editFixedExpense(expense)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteFixedExpense(expense.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fixedExpenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay gastos fijos registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GASTOS GENERALES */}
        {activeTab === 'generales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingGeneral ? 'Editar Gasto General' : 'Agregar Gasto General'}
              </h2>
              {editingGeneral && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>Editando: {editingGeneral.descripcion}</span>
                  <button onClick={cancelEdit} className="text-blue-700 hover:text-blue-900">
                    <X className="w-5 h-5" />
                  </button>
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setNewGeneral({ ...newGeneral, precio: value });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newGeneral.mes}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[
                    'enero',
                    'febrero',
                    'marzo',
                    'abril',
                    'mayo',
                    'junio',
                    'julio',
                    'agosto',
                    'septiembre',
                    'octubre',
                    'noviembre',
                    'diciembre',
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
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
                <button
                  onClick={addGeneralExpense}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {editingGeneral ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Actualizar Gasto General
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Agregar Gasto General
                    </>
                  )}
                </button>
                {editingGeneral && (
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gastos Generales Registrados</h2>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Mes</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todos">Todos los meses</option>
                    {[
                      'enero',
                      'febrero',
                      'marzo',
                      'abril',
                      'mayo',
                      'junio',
                      'julio',
                      'agosto',
                      'septiembre',
                      'octubre',
                      'noviembre',
                      'diciembre',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Año</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todos">Todos los años</option>
                    {getAvailableYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="bg-indigo-50 p-3 rounded-lg w-full">
                    <p className="text-sm text-gray-600">Total Filtrado</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(getFilteredGeneralExpenses().reduce((sum, e) => sum + e.precio, 0))}
                    </p>
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
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(expense.precio)}
                        </td>
                        <td className="px-4 py-3 capitalize">{expense.mes}</td>
                        <td className="px-4 py-3">{formatDate(expense.fecha)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => editGeneralExpense(expense)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteGeneralExpense(expense.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getFilteredGeneralExpenses().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay gastos registrados para los filtros seleccionados
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SEGUIMIENTO */}
        {activeTab === 'seguimiento' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen Anual</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600">Gastos Fijos Anuales</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(getTotalFixedAnual())}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600">Gastos Generales Totales</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(generalExpenses.reduce((sum, e) => sum + e.precio, 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600">Total General</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(
                      getTotalFixedAnual() + generalExpenses.reduce((sum, e) => sum + e.precio, 0)
                    )}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Gastos Generales por Mes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(getGeneralByMonth()).map(([month, total]) => (
                  <div key={month} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">{month}</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(total)}</p>
                  </div>
                ))}
              </div>
            </div>

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

        {/* TAB: CATEGORÍAS */}
        {activeTab === 'categorias' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Categorías</h2>

            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-1">💡 Gestión de Categorías</p>
              <p className="text-sm">
                Puedes editar o eliminar cualquier categoría. Los cambios se guardan automáticamente en la nube.
              </p>
            </div>

            {editingCategory && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                <span>
                  ✏️ Editando categoría: <strong>{editingCategory}</strong>
                </span>
                <button onClick={cancelCategoryEdit} className="text-green-700 hover:text-green-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder={
                  editingCategory
                    ? 'Escribe el nuevo nombre de la categoría'
                    : 'Escribe el nombre de la nueva categoría'
                }
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addCategory}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {editingCategory ? (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Agregar
                  </>
                )}
              </button>
              {editingCategory && (
                <button
                  onClick={cancelCategoryEdit}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-600">Total de categorías: {categories.length}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, index) => (
                <div
                  key={`${cat}-${index}`}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-3 rounded-lg text-indigo-800 font-medium flex items-center justify-between hover:shadow-md transition-all"
                >
                  <span className="flex-1">{cat}</span>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => editCategory(cat)}
                      className="bg-blue-500 text-white hover:bg-blue-600 transition-colors p-2 rounded-md shadow-sm hover:shadow"
                      title="Editar categoría"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="bg-red-500 text-white hover:bg-red-600 transition-colors p-2 rounded-md shadow-sm hover:shadow"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No hay categorías registradas. Agrega tu primera categoría arriba.
              </div>
            )}
          </div>
        )}

        {/* TAB: GESTIÓN DE SUELDO */}
        {activeTab === 'sueldo' && (
          <div className="space-y-6">
            {/* Agregar Sueldo */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Nuevo Sueldo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Monto del sueldo (ej: 2500000)"
                  value={salary.monto}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setSalary({ ...salary, monto: value });
                  }}
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
              <button
                onClick={addSalary}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Registrar Sueldo
              </button>
            </div>

            {/* Historial Completo de Sueldos con Análisis */}
            {salaries.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Historial de Sueldos</h2>
                  <p className="text-gray-600 mb-4">
                    Total de registros: <span className="font-semibold text-indigo-600">{salaries.length}</span>
                  </p>
                </div>

                {salaries.map((salaryRecord, index) => {
                  const fixedData = calculateFixedExpensesForPeriod(
                    salaryRecord.fechaPago,
                    salaryRecord.frecuencia
                  );
                  const generalData = calculateGeneralExpensesForPeriod(
                    salaryRecord.fechaPago,
                    salaryRecord.frecuencia
                  );
                  const totalGastos = fixedData.total + generalData.total;
                  const saldoRestante = salaryRecord.monto - totalGastos;
                  const porcentajeGastado = (totalGastos / salaryRecord.monto) * 100;
                  
                  const startDate = new Date(salaryRecord.fechaPago + 'T12:00:00');
                  const endDate = new Date(salaryRecord.fechaPago + 'T12:00:00');
                  if (salaryRecord.frecuencia === 'quincenal') {
                    endDate.setDate(endDate.getDate() + 15);
                  } else {
                    endDate.setMonth(endDate.getMonth() + 1);
                  }

                  return (
                    <div
                      key={salaryRecord.id}
                      className={`bg-white rounded-xl shadow-md p-6 border-2 ${
                        index === 0 ? 'border-indigo-500' : 'border-transparent'
                      }`}
                    >
                      {/* Header del registro */}
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                              Sueldo {salaryRecord.frecuencia}
                            </h3>
                            {index === 0 && (
                              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                                Más Reciente
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-semibold">Fecha de pago:</span>{' '}
                              {new Date(salaryRecord.fechaPago + 'T12:00:00').toLocaleDateString('es-CO', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p>
                              <span className="font-semibold">Período de análisis:</span>{' '}
                              {formatDate(startDate.toISOString().split('T')[0])} - {formatDate(endDate.toISOString().split('T')[0])}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSalary(salaryRecord.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Resumen financiero */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Sueldo</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(salaryRecord.monto)}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Gastos Fijos</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(fixedData.total)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {((fixedData.total / salaryRecord.monto) * 100).toFixed(1)}% del sueldo
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Gastos Generales</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(generalData.total)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {((generalData.total / salaryRecord.monto) * 100).toFixed(1)}% del sueldo
                          </p>
                        </div>
                        <div
                          className={`${
                            saldoRestante >= 0 ? 'bg-green-50' : 'bg-red-50'
                          } p-4 rounded-lg`}
                        >
                          <p className="text-sm text-gray-600">Saldo Final</p>
                          <p
                            className={`text-2xl font-bold ${
                              saldoRestante >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(saldoRestante)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {saldoRestante >= 0 ? 'Superávit' : 'Déficit'}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Porcentaje de Gastos
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {porcentajeGastado.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${
                              porcentajeGastado > 100
                                ? 'bg-red-500'
                                : porcentajeGastado > 80
                                ? 'bg-orange-500'
                                : porcentajeGastado > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
                          >
                            {porcentajeGastado > 10 && (
                              <span className="text-xs font-bold text-white">
                                {formatCurrency(totalGastos)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Alerta de presupuesto excedido */}
                      {porcentajeGastado > 100 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-800">
                              ¡Presupuesto Excedido!
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              Se gastaron {formatCurrency(totalGastos - salaryRecord.monto)} más del
                              sueldo disponible en este período.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Análisis visual con gráficas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Distribución de gastos */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            Distribución de Gastos
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Gastos Fijos</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {formatCurrency(fixedData.total)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({((fixedData.total / salaryRecord.monto) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className="bg-red-500 h-4 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(
                                      (fixedData.total / salaryRecord.monto) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Gastos Generales</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {formatCurrency(generalData.total)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({((generalData.total / salaryRecord.monto) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className="bg-orange-500 h-4 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(
                                      (generalData.total / salaryRecord.monto) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">
                                  {saldoRestante >= 0 ? 'Disponible' : 'Déficit'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {formatCurrency(Math.abs(saldoRestante))}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({Math.abs((saldoRestante / salaryRecord.monto) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className={`${
                                    saldoRestante >= 0 ? 'bg-green-500' : 'bg-red-500'
                                  } h-4 rounded-full transition-all`}
                                  style={{
                                    width: `${Math.min(
                                      Math.abs((saldoRestante / salaryRecord.monto) * 100),
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gráfico circular */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            Resumen Visual
                          </h4>
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
                            <div className="text-center mb-4">
                              <div className="inline-block">
                                <svg className="w-32 h-32" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={
                                      porcentajeGastado > 100
                                        ? '#EF4444'
                                        : porcentajeGastado > 80
                                        ? '#F97316'
                                        : '#10B981'
                                    }
                                    strokeWidth="3"
                                    strokeDasharray={`${Math.min(porcentajeGastado, 100)}, 100`}
                                  />
                                  <text
                                    x="18"
                                    y="20.35"
                                    className="text-xs font-bold"
                                    fill="currentColor"
                                    textAnchor="middle"
                                  >
                                    {porcentajeGastado.toFixed(0)}%
                                  </text>
                                </svg>
                              </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 font-medium">
                              {porcentajeGastado > 100
                                ? '⚠️ Presupuesto excedido'
                                : porcentajeGastado > 80
                                ? '🔶 Cerca del límite'
                                : porcentajeGastado > 50
                                ? '🟡 Mitad del presupuesto'
                                : '✅ Buen manejo'}
                            </p>
                            <div className="mt-4 pt-4 border-t border-indigo-200">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Total Gastos:</span>
                                <span className="font-semibold text-gray-800">
                                  {formatCurrency(totalGastos)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <span>Total Sueldo:</span>
                                <span className="font-semibold text-gray-800">
                                  {formatCurrency(salaryRecord.monto)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detalles expandibles de gastos */}
                      <details className="group">
                        <summary className="cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 rounded-lg font-semibold text-gray-700 transition-colors flex justify-between items-center">
                          <span>📋 Ver Detalles de Gastos del Período</span>
                          <span className="text-gray-400 group-open:rotate-180 transition-transform">
                            ▼
                          </span>
                        </summary>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Gastos Fijos en el período */}
                          {fixedData.details.length > 0 ? (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-500" />
                                Gastos Fijos ({fixedData.details.length})
                              </h4>
                              <div className="bg-red-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                                {fixedData.details.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-start text-sm bg-white p-2 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-700">
                                        {detail.servicio}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(detail.fecha)}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-red-600">
                                      {formatCurrency(detail.monto)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center text-sm font-bold bg-white p-2 rounded border-t-2 border-red-200 mt-2">
                                  <span className="text-gray-700">Subtotal Fijos:</span>
                                  <span className="text-red-600">
                                    {formatCurrency(fixedData.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-500" />
                                Gastos Fijos
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                Sin gastos fijos en este período
                              </div>
                            </div>
                          )}

                          {/* Gastos Generales en el período */}
                          {generalData.details.length > 0 ? (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-orange-500" />
                                Gastos Generales ({generalData.details.length})
                              </h4>
                              <div className="bg-orange-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                                {generalData.details.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-start text-sm bg-white p-2 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-700">
                                        {detail.descripcion}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(detail.fecha)}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-orange-600">
                                      {formatCurrency(detail.monto)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center text-sm font-bold bg-white p-2 rounded border-t-2 border-orange-200 mt-2">
                                  <span className="text-gray-700">Subtotal Generales:</span>
                                  <span className="text-orange-600">
                                    {formatCurrency(generalData.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-orange-500" />
                                Gastos Generales
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                                Sin gastos generales en este período
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resumen total de gastos */}
                        <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">
                              Total de Gastos en el Período:
                            </span>
                            <span className="text-2xl font-bold text-indigo-600">
                              {formatCurrency(totalGastos)}
                            </span>
                          </div>
                        </div>
                      </details>

                      {/* Comparación con el período anterior (si existe) */}
                      {index < salaries.length - 1 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {(() => {
                            const previousSalary = salaries[index + 1];
                            const prevFixedData = calculateFixedExpensesForPeriod(
                              previousSalary.fechaPago,
                              previousSalary.frecuencia
                            );
                            const prevGeneralData = calculateGeneralExpensesForPeriod(
                              previousSalary.fechaPago,
                              previousSalary.frecuencia
                            );
                            const prevTotalGastos = prevFixedData.total + prevGeneralData.total;
                            const diferenciaGastos = totalGastos - prevTotalGastos;
                            const diferenciaSueldo = salaryRecord.monto - previousSalary.monto;

                            return (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  📊 Comparación con Período Anterior
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600 mb-1">Cambio en Sueldo</p>
                                    <p
                                      className={`font-bold text-lg ${
                                        diferenciaSueldo > 0
                                          ? 'text-green-600'
                                          : diferenciaSueldo < 0
                                          ? 'text-red-600'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {diferenciaSueldo > 0 ? '↗' : diferenciaSueldo < 0 ? '↘' : '→'}{' '}
                                      {formatCurrency(Math.abs(diferenciaSueldo))}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">Cambio en Gastos</p>
                                    <p
                                      className={`font-bold text-lg ${
                                        diferenciaGastos < 0
                                          ? 'text-green-600'
                                          : diferenciaGastos > 0
                                          ? 'text-red-600'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {diferenciaGastos > 0 ? '↗' : diferenciaGastos < 0 ? '↘' : '→'}{' '}
                                      {formatCurrency(Math.abs(diferenciaGastos))}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">Tendencia</p>
                                    <p className="font-bold text-lg text-indigo-600">
                                      {diferenciaGastos < 0 && diferenciaSueldo >= 0
                                        ? '✅ Mejorando'
                                        : diferenciaGastos > 0 && diferenciaSueldo <= 0
                                        ? '⚠️ Empeorando'
                                        : '➡️ Estable'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Resumen estadístico general */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-2xl font-bold mb-4">📈 Estadísticas Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Sueldo Promedio</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          salaries.reduce((sum, s) => sum + s.monto, 0) / salaries.length
                        )}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Gasto Promedio</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          salaries.reduce((sum, s) => {
                            const fixed = calculateFixedExpensesForPeriod(s.fechaPago, s.frecuencia);
                            const general = calculateGeneralExpensesForPeriod(s.fechaPago, s.frecuencia);
                            return sum + fixed.total + general.total;
                          }, 0) / salaries.length
                        )}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Ahorro Promedio</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          salaries.reduce((sum, s) => {
                            const fixed = calculateFixedExpensesForPeriod(s.fechaPago, s.frecuencia);
                            const general = calculateGeneralExpensesForPeriod(s.fechaPago, s.frecuencia);
                            return sum + (s.monto - fixed.total - general.total);
                          }, 0) / salaries.length
                        )}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-sm opacity-90 mb-1">Períodos Registrados</p>
                      <p className="text-2xl font-bold">{salaries.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12text-center">
<Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
<h3 className="text-xl font-bold text-gray-800 mb-2">
No hay sueldos registrados
</h3>
<p className="text-gray-600">
Registra tu primer sueldo arriba para comenzar a llevar control de tus
finanzas.
</p>
</div>
)}
</div>
)}
</div>
</div>
);
}
export default ExpenseTrackerApp;