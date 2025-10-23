
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// IMPORTANT: Replace with your Supabase project's URL and anon key
const supabaseUrl = 'https://cjmaiklfjbtvkgtptevc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbWFpa2xmamJ0dmtndHB0ZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzIyNzQsImV4cCI6MjA3NjgwODI3NH0.M5IbtEia-G4icAfNEyqSyL0ei6M2IRGUwTFWobuWD8w';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
