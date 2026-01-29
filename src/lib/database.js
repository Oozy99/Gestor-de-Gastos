import { supabase } from './supabase'

// ============================================
// CATEGORÍAS
// ============================================
export const getCategories = async (userId) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  
  if (error) throw error
  return data.map(cat => cat.name)
}

export const addCategory = async (userId, name) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ user_id: userId, name }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const updateCategory = async (userId, oldName, newName) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('user_id', userId)
    .eq('name', oldName)
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteCategory = async (userId, name) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .eq('name', name)
  
  if (error) throw error
}

// ============================================
// GASTOS FIJOS
// ============================================
export const getFixedExpenses = async (userId) => {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('fecha_renovacion')
  
  if (error) throw error
  
  // Convertir snake_case a camelCase
  return data.map(expense => ({
    id: expense.id,
    servicio: expense.servicio,
    categoria: expense.categoria,
    cuenta: expense.cuenta,
    precio: parseFloat(expense.precio),
    frecuencia: expense.frecuencia,
    fechaRenovacion: expense.fecha_renovacion,
    costoQuincenal: parseFloat(expense.costo_quincenal),
    costoMensual: parseFloat(expense.costo_mensual),
    costoAnual: parseFloat(expense.costo_anual),
    proximaRenovacion: expense.proxima_renovacion,
    diasRestantes: expense.dias_restantes,
  }))
}

export const addFixedExpense = async (userId, expense) => {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert([{
      user_id: userId,
      servicio: expense.servicio,
      categoria: expense.categoria,
      cuenta: expense.cuenta,
      precio: expense.precio,
      frecuencia: expense.frecuencia,
      fecha_renovacion: expense.fechaRenovacion,
      costo_quincenal: expense.costoQuincenal,
      costo_mensual: expense.costoMensual,
      costo_anual: expense.costoAnual,
      proxima_renovacion: expense.proximaRenovacion,
      dias_restantes: expense.diasRestantes,
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const updateFixedExpense = async (expenseId, expense) => {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update({
      servicio: expense.servicio,
      categoria: expense.categoria,
      cuenta: expense.cuenta,
      precio: expense.precio,
      frecuencia: expense.frecuencia,
      fecha_renovacion: expense.fechaRenovacion,
      costo_quincenal: expense.costoQuincenal,
      costo_mensual: expense.costoMensual,
      costo_anual: expense.costoAnual,
      proxima_renovacion: expense.proximaRenovacion,
      dias_restantes: expense.diasRestantes,
    })
    .eq('id', expenseId)
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteFixedExpense = async (expenseId) => {
  const { error } = await supabase
    .from('fixed_expenses')
    .delete()
    .eq('id', expenseId)
  
  if (error) throw error
}

// ============================================
// GASTOS GENERALES
// ============================================
export const getGeneralExpenses = async (userId) => {
  const { data, error } = await supabase
    .from('general_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('fecha')
  
  if (error) throw error
  
  return data.map(expense => ({
    id: expense.id,
    descripcion: expense.descripcion,
    precio: parseFloat(expense.precio),
    mes: expense.mes,
    fecha: expense.fecha,
    año: expense.año,
  }))
}

export const addGeneralExpense = async (userId, expense) => {
  const { data, error } = await supabase
    .from('general_expenses')
    .insert([{
      user_id: userId,
      descripcion: expense.descripcion,
      precio: expense.precio,
      mes: expense.mes,
      fecha: expense.fecha,
      año: expense.año,
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const updateGeneralExpense = async (expenseId, expense) => {
  const { data, error } = await supabase
    .from('general_expenses')
    .update({
      descripcion: expense.descripcion,
      precio: expense.precio,
      mes: expense.mes,
      fecha: expense.fecha,
      año: expense.año,
    })
    .eq('id', expenseId)
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteGeneralExpense = async (expenseId) => {
  const { error } = await supabase
    .from('general_expenses')
    .delete()
    .eq('id', expenseId)
  
  if (error) throw error
}

// ============================================
// SUELDOS
// ============================================
export const getSalaries = async (userId) => {
  const { data, error } = await supabase
    .from('salaries')
    .select('*')
    .eq('user_id', userId)
    .order('fecha_pago', { ascending: false })
  
  if (error) throw error
  
  return data.map(salary => ({
    id: salary.id,
    monto: parseFloat(salary.monto),
    frecuencia: salary.frecuencia,
    fechaPago: salary.fecha_pago,
    gastosAsignados: [],
  }))
}

export const addSalary = async (userId, salary) => {
  const { data, error } = await supabase
    .from('salaries')
    .insert([{
      user_id: userId,
      monto: salary.monto,
      frecuencia: salary.frecuencia,
      fecha_pago: salary.fechaPago,
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteSalary = async (salaryId) => {
  const { error } = await supabase
    .from('salaries')
    .delete()
    .eq('id', salaryId)
  
  if (error) throw error
}