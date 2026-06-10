import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzvvetokxbjbjmvalcyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dnZldG9reGJqYmptdmFsY3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjYxNTcsImV4cCI6MjA5NjY0MjE1N30.f_m4oIJPgs7VMo9UhP8lwnL9tqY_1nTMZznu0mMTsaI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
