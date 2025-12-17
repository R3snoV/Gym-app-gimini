
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Meal, Workout, UserProfile } from '../types';

// --- SET YOUR CREDENTIALS HERE ---
const SUPABASE_URL = 'https://vhfifrdyotzguwjpxmie.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZmlmcmR5b3R6Z3V3anB4bWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODY2NDcsImV4cCI6MjA4MTU2MjY0N30.tQ07Qa2lSAjwt8ZEjcxTTJWxsnf4_HYUKv5z54oHOik';
const DEFAULT_USER_ID = 'user-123'; // Unique ID for your data
// --------------------------------

let client: SupabaseClient | null = null;

export const isConfigured = () => {
  // Check if placeholders have been replaced with real values
  return (
    SUPABASE_URL.startsWith('https://') && 
    SUPABASE_ANON_KEY.length > 50
  );
};

export const initSupabase = () => {
  if (isConfigured()) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }
  return null;
};

export const syncProfile = async (profile: UserProfile) => {
  if (!client) return;
  const { error } = await client
    .from('profiles')
    .upsert({ 
      id: DEFAULT_USER_ID,
      weight: profile.weight,
      target_calories: profile.targetCalories,
      target_protein: profile.targetProtein,
      target_carbs: profile.targetCarbs,
      target_fats: profile.targetFats,
      is_premium: profile.isPremium,
      credits: profile.credits,
      unit_system: profile.unitSystem,
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Supabase Profile Sync Error:', error);
};

export const syncMeals = async (meals: Meal[]) => {
  if (!client) return;
  const payload = meals.map(m => ({
    id: m.id,
    user_id: DEFAULT_USER_ID,
    timestamp: new Date(m.timestamp).toISOString(),
    name: m.name,
    foods: m.foods,
    total_calories: m.totalCalories,
    total_protein: m.totalProtein,
    total_carbs: m.totalCarbs,
    total_fats: m.totalFats
  }));
  
  const { error } = await client.from('meals').upsert(payload);
  if (error) console.error('Supabase Meals Sync Error:', error);
};

export const syncWorkouts = async (workouts: Workout[]) => {
  if (!client) return;
  const payload = workouts.map(w => ({
    id: w.id,
    user_id: DEFAULT_USER_ID,
    timestamp: new Date(w.timestamp).toISOString(),
    type: w.type,
    duration: w.duration,
    intensity: w.intensity,
    estimated_burn: w.estimatedBurn
  }));
  
  const { error } = await client.from('workouts').upsert(payload);
  if (error) console.error('Supabase Workouts Sync Error:', error);
};

export const fetchAllData = async () => {
  if (!client) return null;
  
  const [profileRes, mealsRes, workoutsRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', DEFAULT_USER_ID).single(),
    client.from('meals').select('*').eq('user_id', DEFAULT_USER_ID).order('timestamp', { ascending: false }),
    client.from('workouts').select('*').eq('user_id', DEFAULT_USER_ID).order('timestamp', { ascending: false })
  ]);

  return {
    profile: profileRes.data,
    meals: mealsRes.data?.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp).getTime(),
      totalCalories: m.total_calories,
      totalProtein: m.total_protein,
      totalCarbs: m.total_carbs,
      totalFats: m.total_fats
    })),
    workouts: workoutsRes.data?.map(w => ({
      ...w,
      timestamp: new Date(w.timestamp).getTime(),
      estimatedBurn: w.estimated_burn
    }))
  };
};
