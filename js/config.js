// ============================================================================
// Configuración del Cliente Supabase — Pulso
// ============================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Reemplazar con las credenciales de tu proyecto en Supabase (Settings -> API)
export const SUPABASE_URL = window.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
export const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

// Instancia única exportada del cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
