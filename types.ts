
export enum UnitType {
  PIECE = 'piece(s)',
  SLICE = 'slice(s)',
  BOWL = 'bowl(s)',
  PORTION = 'portion(s)',
  CUP = 'cup(s)',
  GRAM = 'g'
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: UnitType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  timestamp: number;
  name: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface Workout {
  id: string;
  timestamp: number;
  type: 'Strength' | 'Cardio' | 'Other';
  duration: number; // minutes
  intensity: 'Low' | 'Medium' | 'High';
  estimatedBurn: number;
}

export type Gender = 'Male' | 'Female' | 'Other';
export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Athlete';
export type FitnessGoal = 'Lose Weight' | 'Maintain' | 'Gain Muscle';

export interface UserProfile {
  onboarded: boolean;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  isPremium: boolean;
  credits: number;
  unitSystem: 'kg' | 'lb';
}

export type AppTab = 'Diet' | 'Workouts' | 'Progress' | 'Profile';
