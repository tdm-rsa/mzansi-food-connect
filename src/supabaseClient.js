import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iuuckvthpmttrsutmvga.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzYzOTMsImV4cCI6MjA3NzI1MjM5M30.hl4pWe8VRqPUSGiV4ihMPEUesUWfdm1KJL3uvUbtsM0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
