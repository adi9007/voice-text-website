// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qtdjfggpouaeopximxfw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGpmZ2dwb3VhZW9weGlteGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODc0NjYsImV4cCI6MjA2NjI2MzQ2Nn0.aucDWiMaQO3-ZpOJSfaIIEg6iafzklbsZZnwNNeeRI0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);