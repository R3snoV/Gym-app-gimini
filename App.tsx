
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppTab, Meal, Workout, UserProfile, FoodItem, UnitType } from './types';
import { INITIAL_PROFILE, COMMON_FOODS } from './constants';
import { Card, Button, ProgressBar, Modal } from './components/UI';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { scanMealPhoto, getSmartInsights } from './services/geminiService';
import * as SupabaseService from './services/supabaseService';

// Icons
const Icons = {
  Diet: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Workouts: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Progress: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Profile: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Add: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
  Scan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Premium: () => <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Cloud: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('Diet');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [smartInsight, setSmartInsight] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persistence & Initial Sync
  useEffect(() => {
    const savedMeals = localStorage.getItem('fitfocus_meals');
    const savedWorkouts = localStorage.getItem('fitfocus_workouts');
    const savedProfile = localStorage.getItem('fitfocus_profile');
    
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    handleInitialSupabaseSync();
  }, []);

  const handleInitialSupabaseSync = async () => {
    if (!SupabaseService.isConfigured()) return;
    
    setIsSyncing(true);
    SupabaseService.initSupabase();
    const data = await SupabaseService.fetchAllData();
    if (data) {
      if (data.meals && data.meals.length > 0) setMeals(data.meals);
      if (data.workouts && data.workouts.length > 0) setWorkouts(data.workouts);
      if (data.profile) {
        setProfile(prev => ({
          ...prev,
          weight: data.profile.weight ?? prev.weight,
          targetCalories: data.profile.target_calories ?? prev.targetCalories,
          targetProtein: data.profile.target_protein ?? prev.targetProtein,
          targetCarbs: data.profile.target_carbs ?? prev.targetCarbs,
          targetFats: data.profile.target_fats ?? prev.targetFats,
          isPremium: data.profile.is_premium ?? prev.isPremium,
          credits: data.profile.credits ?? prev.credits,
          unitSystem: data.profile.unit_system ?? prev.unitSystem
        }));
      }
    }
    setIsSyncing(false);
  };

  // Auto-sync on changes
  useEffect(() => {
    localStorage.setItem('fitfocus_meals', JSON.stringify(meals));
    localStorage.setItem('fitfocus_workouts', JSON.stringify(workouts));
    localStorage.setItem('fitfocus_profile', JSON.stringify(profile));

    if (SupabaseService.isConfigured()) {
      SupabaseService.initSupabase();
      SupabaseService.syncProfile(profile);
      SupabaseService.syncMeals(meals);
      SupabaseService.syncWorkouts(workouts);
    }
  }, [meals, workouts, profile]);

  // Insights logic
  useEffect(() => {
    if (profile.isPremium && meals.length > 5 && !smartInsight) {
      const fetchInsights = async () => {
        const insight = await getSmartInsights({ meals: meals.slice(-10), workouts: workouts.slice(-5) });
        setSmartInsight(insight);
      };
      fetchInsights();
    }
  }, [meals, workouts, profile.isPremium, smartInsight]);

  // Derived Data
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysMeals = meals.filter(m => new Date(m.timestamp).setHours(0, 0, 0, 0) === today);
  const todaysMacros = todaysMeals.reduce((acc, m) => ({
    cal: acc.cal + m.totalCalories,
    prot: acc.prot + m.totalProtein,
    carb: acc.carb + m.totalCarbs,
    fat: acc.fat + m.totalFats
  }), { cal: 0, prot: 0, carb: 0, fat: 0 });

  const handleAddMeal = (newFoods: FoodItem[]) => {
    const totalCalories = newFoods.reduce((s, f) => s + f.calories, 0);
    const totalProtein = newFoods.reduce((s, f) => s + f.protein, 0);
    const totalCarbs = newFoods.reduce((s, f) => s + f.carbs, 0);
    const totalFats = newFoods.reduce((s, f) => s + f.fats, 0);

    const newMeal: Meal = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name: `Meal ${todaysMeals.length + 1}`,
      foods: newFoods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats
    };
    setMeals([newMeal, ...meals]);
    setIsMealModalOpen(false);
  };

  const handleAddWorkout = (w: Partial<Workout>) => {
    const workout: Workout = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: w.type || 'Strength',
      duration: w.duration || 30,
      intensity: w.intensity || 'Medium',
      estimatedBurn: w.estimatedBurn || 200
    };
    setWorkouts([workout, ...workouts]);
    setIsWorkoutModalOpen(false);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile.isPremium && profile.credits <= 0) {
      alert("No scan credits left. Upgrade to Premium for unlimited scans!");
      return;
    }

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        const results = await scanMealPhoto(base64);
        if (results.length > 0) {
          setIsScanModalOpen(false);
          setPendingScannedFoods(results as FoodItem[]);
        } else {
          alert("Couldn't recognize any foods. Please try again.");
        }
      }
      setIsScanning(false);
      if (!profile.isPremium) {
        setProfile(p => ({ ...p, credits: Math.max(0, p.credits - 1) }));
      }
    };
  };

  const [pendingScannedFoods, setPendingScannedFoods] = useState<FoodItem[] | null>(null);

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative bg-slate-50">
      <header className="px-6 py-6 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">FitFocus</h1>
            <p className="text-slate-500 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && <div className="animate-spin text-indigo-600"><Icons.Cloud /></div>}
            {profile.isPremium && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Icons.Premium />
                <span className="text-xs font-bold text-amber-700 uppercase">Premium</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {activeTab === 'Diet' && <DietView macros={todaysMacros} profile={profile} todaysMeals={todaysMeals} onOpenAdd={() => setIsMealModalOpen(true)} onOpenScan={() => setIsScanModalOpen(true)} insight={smartInsight} />}
        {activeTab === 'Workouts' && <WorkoutsView workouts={workouts} onOpenAdd={() => setIsWorkoutModalOpen(true)} />}
        {activeTab === 'Progress' && <ProgressView meals={meals} workouts={workouts} profile={profile} />}
        {activeTab === 'Profile' && <ProfileView profile={profile} setProfile={setProfile} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center px-4 py-3 safe-bottom z-30 max-w-md mx-auto">
        {(['Diet', 'Workouts', 'Progress', 'Profile'] as AppTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}>
            {tab === 'Diet' && <Icons.Diet />}
            {tab === 'Workouts' && <Icons.Workouts />}
            {tab === 'Progress' && <Icons.Progress />}
            {tab === 'Profile' && <Icons.Profile />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab}</span>
          </button>
        ))}
      </nav>

      <Modal isOpen={isMealModalOpen || !!pendingScannedFoods} onClose={() => { setIsMealModalOpen(false); setPendingScannedFoods(null); }} title="Log Your Meal">
        <AddMealForm initialFoods={pendingScannedFoods || []} onSave={handleAddMeal} />
      </Modal>

      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="AI Meal Scanner">
        <div className="space-y-4 py-4">
          <div className="aspect-square rounded-2xl bg-indigo-50 flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 text-indigo-600 p-8 text-center">
            <Icons.Scan />
            <p className="mt-4 font-bold">Snap a photo of your food</p>
            <p className="text-sm text-indigo-400 mt-1">Estimates calories & macros automatically</p>
          </div>
          <div className="relative">
            <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleScan} disabled={isScanning} />
            <Button fullWidth variant="primary" disabled={isScanning}>{isScanning ? 'Analyzing Meal...' : 'Open Camera / Upload'}</Button>
          </div>
          {!profile.isPremium && <p className="text-center text-xs text-slate-400">You have <span className="font-bold text-indigo-600">{profile.credits} scans</span> remaining.</p>}
        </div>
      </Modal>

      <Modal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} title="Log Workout">
        <AddWorkoutForm onSave={handleAddWorkout} />
      </Modal>
    </div>
  );
};

// --- View Components ---

const DietView: React.FC<{ macros: any; profile: UserProfile; todaysMeals: Meal[]; onOpenAdd: () => void; onOpenScan: () => void; insight: string | null; }> = ({ macros, profile, todaysMeals, onOpenAdd, onOpenScan, insight }) => (
  <div className="space-y-6 fade-in">
    <Card className="bg-indigo-600 text-white border-none">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Calories Remaining</span>
          <div className="text-4xl font-black mt-1">{Math.max(0, profile.targetCalories - macros.cal)} <span className="text-xl font-normal opacity-70">kcal</span></div>
        </div>
        <div className="bg-white/10 p-2 rounded-xl"><Icons.Diet /></div>
      </div>
      <div className="space-y-4">
        <ProgressBar label="Protein" current={macros.prot} target={profile.targetProtein} color="bg-white" unit="g" />
        <div className="grid grid-cols-2 gap-4">
          <ProgressBar label="Carbs" current={macros.carb} target={profile.targetCarbs} color="bg-white/60" unit="g" />
          <ProgressBar label="Fats" current={macros.fat} target={profile.targetFats} color="bg-white/30" unit="g" />
        </div>
      </div>
    </Card>
    {insight && <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3"><div className="bg-amber-200 text-amber-700 p-1.5 rounded-lg h-fit"><Icons.Premium /></div><div><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Smart Insight</span><p className="text-sm text-amber-900 mt-0.5">{insight}</p></div></div>}
    <div className="grid grid-cols-2 gap-4"><Button onClick={onOpenAdd} variant="outline" fullWidth><Icons.Add /> Add Manually</Button><Button onClick={onOpenScan} variant="primary" fullWidth><Icons.Scan /> AI Scan</Button></div>
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Today's Meals</h3>
      {todaysMeals.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">No meals logged yet today</div> : todaysMeals.map(meal => <Card key={meal.id} className="flex justify-between items-center group"><div><p className="font-bold text-slate-800">{meal.name}</p><p className="text-xs text-slate-500 font-medium">{meal.foods.length} items • {meal.totalCalories} kcal</p></div><div className="text-right"><span className="text-indigo-600 font-black">{meal.totalProtein}g</span><p className="text-[10px] text-slate-400 font-bold uppercase">Protein</p></div></Card>)}
      <p className="text-[10px] text-center text-slate-400 italic">All values are estimations based on typical food averages.</p>
    </div>
  </div>
);

const WorkoutsView: React.FC<{ workouts: Workout[]; onOpenAdd: () => void; }> = ({ workouts, onOpenAdd }) => {
  const currentWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.timestamp);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= startOfWeek;
  });
  return (
    <div className="space-y-6 fade-in">
      <Card className="bg-emerald-500 text-white border-none flex justify-between items-center">
        <div><span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Weekly Activity</span><div className="text-4xl font-black mt-1">{currentWeekWorkouts.length} <span className="text-xl font-normal opacity-70">Workouts</span></div></div>
        <div className="bg-white/20 h-16 w-16 rounded-full flex items-center justify-center"><Icons.Workouts /></div>
      </Card>
      <Button onClick={onOpenAdd} variant="primary" fullWidth><Icons.Add /> Log Workout</Button>
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">History</h3>
        {workouts.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">No workouts logged yet</div> : workouts.map(w => <Card key={w.id} className="flex items-center gap-4"><div className={`p-3 rounded-xl ${w.type === 'Strength' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>{w.type === 'Strength' ? <Icons.Workouts /> : <Icons.Diet />}</div><div className="flex-1"><div className="flex justify-between"><p className="font-bold text-slate-800">{w.type}</p><span className="text-xs text-slate-400">{new Date(w.timestamp).toLocaleDateString()}</span></div><div className="flex gap-4 text-xs text-slate-500 font-medium"><span>{w.duration} min</span><span>{w.intensity} Intensity</span><span className="text-emerald-600 font-bold">~{w.estimatedBurn} kcal</span></div></div></Card>)}
      </div>
    </div>
  );
};

const ProgressView: React.FC<{ meals: Meal[]; workouts: Workout[]; profile: UserProfile; }> = ({ meals, workouts, profile }) => {
  const dailyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === d.toDateString());
      const dayWorkouts = workouts.filter(w => new Date(w.timestamp).toDateString() === d.toDateString());
      data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), calories: dayMeals.reduce((s, m) => s + m.totalCalories, 0), protein: dayMeals.reduce((s, m) => s + m.totalProtein, 0) });
    }
    return data;
  }, [meals, workouts]);
  return (
    <div className="space-y-6 fade-in">
      <h3 className="text-lg font-bold text-slate-800">Weekly Performance</h3>
      <div className="relative">
        {!profile.isPremium && <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl p-6 text-center border-2 border-slate-100 shadow-xl"><Icons.Premium /><h4 className="font-bold text-slate-800 mt-2">Advanced Analytics</h4><p className="text-sm text-slate-500 mt-1 mb-4">Upgrade to Premium to visualize charts.</p><Button variant="primary">Unlock Stats</Button></div>}
        <Card className={`space-y-8 ${!profile.isPremium ? 'opacity-20 select-none pointer-events-none' : ''}`}>
          <div className="h-48 w-full"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Calories</p><ResponsiveContainer width="100%" height="100%"><LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><Tooltip /><Line type="monotone" dataKey="calories" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} /></LineChart></ResponsiveContainer></div>
          <div className="h-48 w-full"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Protein</p><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><Tooltip /><Bar dataKey="protein" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ profile: UserProfile; setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }> = ({ profile, setProfile }) => (
  <div className="space-y-6 fade-in pb-12">
    <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">{profile.weight}</div><div><h3 className="font-bold text-lg text-slate-800">My Fitness Goal</h3><p className="text-sm text-slate-500">Weight: {profile.weight}{profile.unitSystem}</p></div></div>
    <Card className="space-y-4">
      <h4 className="font-bold text-slate-800">Daily Targets</h4>
      <div className="space-y-3">
        <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Calories</label><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={profile.targetCalories} onChange={e => setProfile({...profile, targetCalories: Number(e.target.value)})} /></div>
        <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Protein (g)</label><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={profile.targetProtein} onChange={e => setProfile({...profile, targetProtein: Number(e.target.value)})} /></div>
      </div>
    </Card>
    <Card className="bg-indigo-50 border-indigo-100"><div className="flex items-center gap-3 mb-3"><Icons.Premium /><h4 className="font-bold text-indigo-900">Unlock Premium</h4></div><p className="text-sm text-indigo-700 mb-4">Get AI Meal Scanning and Smart Insights.</p><Button variant="primary" fullWidth onClick={() => setProfile({...profile, isPremium: !profile.isPremium})}>{profile.isPremium ? 'Cancel Premium' : 'Upgrade'}</Button></Card>
    <p className="text-[10px] text-center text-slate-400 px-6">FitFocus provides estimations only. Consult a professional before dieting.</p>
  </div>
);

// --- Form Components ---

const AddMealForm: React.FC<{ initialFoods?: FoodItem[]; onSave: (foods: FoodItem[]) => void }> = ({ initialFoods = [], onSave }) => {
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Partial<FoodItem>[]>([]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 1) setSuggestions(COMMON_FOODS.filter(f => f.name?.toLowerCase().includes(term.toLowerCase())));
    else setSuggestions([]);
  };

  const addFood = (item: Partial<FoodItem>) => {
    setFoods([...foods, { name: item.name!, quantity: 1, unit: item.unit!, calories: item.calories!, protein: item.protein!, carbs: item.carbs!, fats: item.fats! }]);
    setSearchTerm(''); setSuggestions([]);
  };

  const updateQuantity = (index: number, q: number) => {
    const updated = [...foods];
    const original = COMMON_FOODS.find(f => f.name === updated[index].name) || updated[index];
    updated[index].quantity = q;
    updated[index].calories = Math.round(original.calories! * q);
    updated[index].protein = Math.round(original.protein! * q);
    setFoods(updated);
  };

  const totals = foods.reduce((acc, f) => ({ cal: acc.cal + f.calories, prot: acc.prot + f.protein }), { cal: 0, prot: 0 });

  return (
    <div className="space-y-6">
      <input type="text" placeholder="Search food..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={searchTerm} onChange={e => handleSearch(e.target.value)} />
      {suggestions.length > 0 && <div className="border border-slate-100 shadow rounded-xl">{suggestions.map((s, idx) => <button key={idx} className="w-full text-left px-4 py-3 border-b border-slate-50 last:border-0" onClick={() => addFood(s)}>{s.name} ({s.calories} kcal)</button>)}</div>}
      <div className="space-y-2">{foods.map((f, i) => <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl"><div><p className="font-bold">{f.name}</p><input type="number" step="0.5" className="w-12 text-xs" value={f.quantity} onChange={e => updateQuantity(i, Number(e.target.value))} /> {f.unit}</div><p>{f.calories} kcal</p></div>)}</div>
      {foods.length > 0 && <Button fullWidth onClick={() => onSave(foods)}>Save Meal ({totals.cal} kcal)</Button>}
    </div>
  );
};

const AddWorkoutForm: React.FC<{ onSave: (w: Partial<Workout>) => void }> = ({ onSave }) => {
  const [type, setType] = useState<'Strength' | 'Cardio' | 'Other'>('Strength');
  const [duration, setDuration] = useState(30);
  const estimatedBurn = useMemo(() => Math.round(duration * (type === 'Cardio' ? 8 : 5)), [type, duration]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">{(['Strength', 'Cardio', 'Other'] as const).map(t => <button key={t} onClick={() => setType(t)} className={`p-4 rounded-xl border ${type === t ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>{t}</button>)}</div>
      <input type="range" min="5" max="120" step="5" className="w-full" value={duration} onChange={e => setDuration(Number(e.target.value))} />
      <p className="text-center font-bold">{duration} min (~{estimatedBurn} kcal)</p>
      <Button fullWidth onClick={() => onSave({ type, duration, estimatedBurn })}>Log Workout</Button>
    </div>
  );
};

export default App;
