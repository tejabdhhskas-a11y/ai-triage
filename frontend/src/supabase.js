import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ugdfqllqkaprzchjbiy.supabase.co'
const supabaseKey = 'sb_publishable_Ehcj46-Z7X2AguVuS17jNA_UAKKMes5'

export const supabase = createClient(supabaseUrl, supabaseKey)