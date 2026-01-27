// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itimmawwgplswqnuxmhl.supabase.co'
const supabaseKey = 'sb_publishable_mKMiQAdGJWJmgoDnWqxFKA_qfbFvGRi'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
