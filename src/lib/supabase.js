import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtauevtjxkzciqamjakg.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YXVldnRqeGt6Y2lxYW1qYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzc3MzUsImV4cCI6MjA4NTIxMzczNX0.5F11ZX8c3JAkqoKCdu5-uO-zJURU5sx7WdXP8h8cBpQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)