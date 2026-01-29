import { supabase } from './supabase'

// Registrar nuevo usuario
export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (error) throw error
  return data
}

// Iniciar sesión
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

// Cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obtener usuario actual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Escuchar cambios de autenticación
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}