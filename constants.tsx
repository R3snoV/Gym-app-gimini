
import React from 'react';
import { UnitType, FoodItem, UserProfile } from './types';

export const COMMON_FOODS: Partial<FoodItem>[] = [
  { name: 'Egg', calories: 70, protein: 6, carbs: 0, fats: 5, unit: UnitType.PIECE },
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, unit: UnitType.PORTION },
  { name: 'White Rice', calories: 200, protein: 4, carbs: 45, fats: 0.5, unit: UnitType.BOWL },
  { name: 'Bread', calories: 80, protein: 3, carbs: 15, fats: 1, unit: UnitType.SLICE },
  { name: 'Milk', calories: 120, protein: 8, carbs: 12, fats: 5, unit: UnitType.CUP },
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fats: 0.3, unit: UnitType.PIECE },
  { name: 'Pasta', calories: 220, protein: 8, carbs: 43, fats: 1.3, unit: UnitType.BOWL },
  { name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 4, fats: 5, unit: UnitType.CUP },
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fats: 2.5, unit: UnitType.BOWL },
  { name: 'Beef Portion', calories: 250, protein: 26, carbs: 0, fats: 15, unit: UnitType.PORTION }
];

export const INITIAL_PROFILE: UserProfile = {
  onboarded: false,
  age: 25,
  gender: 'Male',
  height: 175,
  weight: 75,
  activityLevel: 'Moderately Active',
  goal: 'Maintain',
  targetCalories: 2200,
  targetProtein: 150,
  targetCarbs: 250,
  targetFats: 70,
  isPremium: false,
  credits: 3,
  unitSystem: 'kg'
};
