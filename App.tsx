
import React, { useState, useEffect, useMemo } from 'react';
import { AppTab, Meal, Workout, UserProfile, FoodItem, Gender, ActivityLevel, FitnessGoal } from './types';
import { INITIAL_PROFILE, COMMON_FOODS } from './constants';
import { Card, Button, ProgressBar, Modal } from './components/UI';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  Cloud: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  ArrowRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
    }

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
          ...data.profile,
          onboarded: data.profile.onboarded ?? prev.onboarded
        }));
      }
    }
    setIsSyncing(false);
  };

  // Auto-sync on changes
  useEffect(() => {
    if (profile.onboarded) {
      localStorage.setItem('fitfocus_meals', JSON.stringify(meals));
      localStorage.setItem('fitfocus_workouts', JSON.stringify(workouts));
      localStorage.setItem('fitfocus_profile', JSON.stringify(profile));

      if (SupabaseService.isConfigured()) {
        SupabaseService.initSupabase();
        SupabaseService.syncProfile(profile);
        SupabaseService.syncMeals(meals);
        SupabaseService.syncWorkouts(workouts);
      }
    }
  }, [meals, workouts, profile]);

  // Derived Data
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysMeals = meals.filter(m => new Date(m.timestamp).setHours(0, 0, 0, 0) === today);
  const todaysMacros = todaysMeals.reduce((acc, m) => ({
    cal: acc.cal + m.totalCalories,
    prot: acc.prot + m.totalProtein,
    carb: acc.carb + m.totalCarbs,
    fat: acc.fat + m.totalFats
  }), { cal: 0, prot: 0, carb: 0, fat: 0 });

  if (!profile.onboarded) {
    return <OnboardingFlow profile={profile} onComplete={(p) => setProfile(p)} />;
  }

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

      {/* Modals from previous version kept for functionality */}
      <Modal isOpen={isMealModalOpen} onClose={() => setIsMealModalOpen(false)} title="Log Your Meal">
        <AddMealForm onSave={(foods) => {
          const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
          const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
          const newMeal: Meal = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            name: `Meal ${todaysMeals.length + 1}`,
            foods,
            totalCalories,
            totalProtein,
            totalCarbs: foods.reduce((s, f) => s + f.carbs, 0),
            totalFats: foods.reduce((s, f) => s + f.fats, 0)
          };
          setMeals([newMeal, ...meals]);
          setIsMealModalOpen(false);
        }} />
      </Modal>

      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="AI Meal Scanner">
         <div className="py-8 text-center space-y-4">
            <div className="bg-indigo-50 p-6 rounded-3xl inline-block mb-2">
               <Icons.Scan />
            </div>
            <h4 className="font-bold text-lg">Coming soon in Premium</h4>
            <p className="text-slate-500 text-sm">Snap a photo and let AI track your macros.</p>
            <Button onClick={() => setIsScanModalOpen(false)}>Close</Button>
         </div>
      </Modal>

      <Modal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} title="Log Workout">
        <AddWorkoutForm onSave={(w) => {
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
        }} />
      </Modal>
    </div>
  );
};

// --- Onboarding Flow ---

const OnboardingFlow: React.FC<{ profile: UserProfile; onComplete: (p: UserProfile) => void }> = ({ profile, onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>(profile);

  const calculateTargets = (d: Partial<UserProfile>): UserProfile => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * d.weight!) + (6.25 * d.height!) - (5 * d.age!);
    bmr = d.gender === 'Male' ? bmr + 5 : bmr - 161;

    const activityMultipliers = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725,
      'Athlete': 1.9
    };
    
    let tdee = bmr * activityMultipliers[d.activityLevel || 'Moderately Active'];
    
    if (d.goal === 'Lose Weight') tdee -= 500;
    if (d.goal === 'Gain Muscle') tdee += 300;

    const calories = Math.round(tdee);
    const protein = Math.round(d.weight! * 2); // 2g per kg
    const fats = Math.round((calories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);

    return {
      ...(d as UserProfile),
      onboarded: true,
      targetCalories: calories,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFats: fats
    };
  };

  const steps = [
    { title: "Basic Info", subtitle: "Let's start with the basics." },
    { title: "Your Body", subtitle: "Tell us about your physique." },
    { title: "Lifestyle", subtitle: "How active are you daily?" },
    { title: "Your Goal", subtitle: "What do you want to achieve?" },
    { title: "Your Plan", subtitle: "We've calculated your targets." }
  ];

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-between max-w-md mx-auto fade-in">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-indigo-600 font-black text-xs uppercase tracking-widest">Step {step} of 5</span>
            <h1 className="text-3xl font-black text-slate-800">{steps[step - 1].title}</h1>
            <p className="text-slate-500 font-medium">{steps[step-1].subtitle}</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center font-black text-slate-300">
            {step}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
             <div className="grid grid-cols-3 gap-3">
                {(['Male', 'Female', 'Other'] as Gender[]).map(g => (
                  <button key={g} onClick={() => setData({...data, gender: g})} className={`p-4 rounded-2xl border-2 transition-all font-bold ${data.gender === g ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>{g}</button>
                ))}
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">How old are you?</label>
                <input type="number" className="w-full text-4xl font-black bg-transparent outline-none border-b-4 border-slate-100 focus:border-indigo-600 py-4" value={data.age} onChange={e => setData({...data, age: Number(e.target.value)})} />
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Height (cm)</label>
                <input type="number" className="w-full text-4xl font-black bg-transparent outline-none border-b-4 border-slate-100 focus:border-indigo-600 py-4" value={data.height} onChange={e => setData({...data, height: Number(e.target.value)})} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                <input type="number" className="w-full text-4xl font-black bg-transparent outline-none border-b-4 border-slate-100 focus:border-indigo-600 py-4" value={data.weight} onChange={e => setData({...data, weight: Number(e.target.value)})} />
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
             {(['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'] as ActivityLevel[]).map(lvl => (
                <button key={lvl} onClick={() => setData({...data, activityLevel: lvl})} className={`w-full text-left p-6 rounded-3xl border-2 transition-all font-bold flex justify-between items-center ${data.activityLevel === lvl ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>
                  {lvl}
                  {data.activityLevel === lvl && <Icons.ArrowRight />}
                </button>
             ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
             {(['Lose Weight', 'Maintain', 'Gain Muscle'] as FitnessGoal[]).map(g => (
                <button key={g} onClick={() => setData({...data, goal: g})} className={`w-full text-left p-8 rounded-3xl border-2 transition-all font-bold flex justify-between items-center ${data.goal === g ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>
                  <span className="text-xl">{g}</span>
                  {data.goal === g && <Icons.ArrowRight />}
                </button>
             ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
             <div className="bg-indigo-600 text-white p-8 rounded-[40px] space-y-4">
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs text-center">Your daily calories</p>
                <h2 className="text-6xl font-black text-center">{calculateTargets(data).targetCalories}</h2>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
                   <div className="text-center">
                      <p className="text-[10px] font-bold opacity-70">Protein</p>
                      <p className="font-black">{calculateTargets(data).targetProtein}g</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-bold opacity-70">Carbs</p>
                      <p className="font-black">{calculateTargets(data).targetCarbs}g</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-bold opacity-70">Fats</p>
                      <p className="font-black">{calculateTargets(data).targetFats}g</p>
                   </div>
                </div>
             </div>
             <p className="text-sm text-slate-400 text-center px-4">These targets are estimations based on scientific formulas. Adjust as you progress.</p>
          </div>
        )}
      </div>

      <div className="pt-8">
        {/* Fix: Removed unsupported 'size' prop to match Button interface */}
        <Button 
          fullWidth 
          onClick={() => step < 5 ? setStep(step + 1) : onComplete(calculateTargets(data))}
        >
          {step === 5 ? "Start My Journey" : "Continue"} <Icons.ArrowRight />
        </Button>
      </div>
    </div>
  );
};

// --- Standard Views kept but refactored slightly for the new profile fields ---

const DietView: React.FC<{ macros: any; profile: UserProfile; todaysMeals: Meal[]; onOpenAdd: () => void; onOpenScan: () => void; insight: string | null; }> = ({ macros, profile, todaysMeals, onOpenAdd, onOpenScan, insight }) => (
  <div className="space-y-6 fade-in">
    <Card className="bg-indigo-600 text-white border-none p-8 rounded-[32px]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Calories Remaining</span>
          <div className="text-5xl font-black mt-2">{Math.max(0, profile.targetCalories - macros.cal)}</div>
        </div>
        <div className="bg-white/10 p-3 rounded-2xl"><Icons.Diet /></div>
      </div>
      <div className="space-y-4">
        <ProgressBar label="Protein" current={macros.prot} target={profile.targetProtein} color="bg-white" unit="g" />
        <div className="grid grid-cols-2 gap-6">
          <ProgressBar label="Carbs" current={macros.carb} target={profile.targetCarbs} color="bg-white/60" unit="g" />
          <ProgressBar label="Fats" current={macros.fat} target={profile.targetFats} color="bg-white/30" unit="g" />
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-2 gap-4"><Button onClick={onOpenAdd} variant="outline" fullWidth><Icons.Add /> Add Meal</Button><Button onClick={onOpenScan} variant="primary" fullWidth><Icons.Scan /> AI Scan</Button></div>
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Today's Log</h3>
      {todaysMeals.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">Log your first meal.</div> : todaysMeals.map(meal => <Card key={meal.id} className="flex justify-between items-center"><div><p className="font-bold text-slate-800">{meal.name}</p><p className="text-xs text-slate-500 font-medium">{meal.totalCalories} kcal</p></div><div className="text-right"><span className="text-indigo-600 font-black">{meal.totalProtein}g</span><p className="text-[10px] text-slate-400 font-bold uppercase">Protein</p></div></Card>)}
    </div>
  </div>
);

const WorkoutsView: React.FC<{ workouts: Workout[]; onOpenAdd: () => void; }> = ({ workouts, onOpenAdd }) => (
  <div className="space-y-6 fade-in">
    <Card className="bg-emerald-500 text-white border-none flex justify-between items-center p-8 rounded-[32px]">
      <div><span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Weekly Goal</span><div className="text-5xl font-black mt-2">{workouts.length}</div></div>
      <div className="bg-white/20 h-20 w-20 rounded-full flex items-center justify-center"><Icons.Workouts /></div>
    </Card>
    {/* Fix: Removed unsupported 'size' prop to match Button interface */}
    <Button onClick={onOpenAdd} variant="primary" fullWidth>Log Workout</Button>
    <div className="space-y-4">
       {workouts.map(w => <Card key={w.id} className="flex items-center gap-4"><div className="p-3 bg-slate-50 rounded-xl"><Icons.Workouts /></div><div><p className="font-bold">{w.type}</p><p className="text-xs text-slate-500">{w.duration} min • {w.estimatedBurn} kcal</p></div></Card>)}
    </div>
  </div>
);

const ProgressView: React.FC<{ meals: Meal[]; workouts: Workout[]; profile: UserProfile; }> = ({ meals, workouts, profile }) => (
  <div className="space-y-6 fade-in text-center pt-12">
    <Icons.Progress />
    <h3 className="text-2xl font-black">Performance Tracking</h3>
    <p className="text-slate-500">Track your weekly evolution with charts.</p>
    {!profile.isPremium && <Card className="bg-amber-50 border-amber-100"><Icons.Premium /><p className="text-amber-800 font-bold mt-2">Premium Feature</p><p className="text-sm text-amber-600 mb-4">Detailed charts are available for Premium users.</p><Button fullWidth>Unlock Now</Button></Card>}
  </div>
);

const ProfileView: React.FC<{ profile: UserProfile; setProfile: (p: UserProfile) => void }> = ({ profile, setProfile }) => (
  <div className="space-y-6 fade-in pb-12">
    <div className="bg-white p-8 rounded-[40px] shadow-sm text-center space-y-4">
       <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-4xl font-black text-slate-400">{profile.weight}</div>
       <div>
          <h3 className="text-2xl font-black">{profile.goal}</h3>
          <p className="text-slate-500 font-medium">{profile.age} years • {profile.height}cm • {profile.gender}</p>
       </div>
    </div>
    <Card className="space-y-4 p-6">
       <h4 className="font-black text-slate-400 uppercase text-xs tracking-widest">Targets</h4>
       <div className="space-y-4">
          <div className="flex justify-between items-center"><span className="font-bold">Daily Calories</span><span className="font-black text-indigo-600">{profile.targetCalories} kcal</span></div>
          <div className="flex justify-between items-center"><span className="font-bold">Daily Protein</span><span className="font-black text-indigo-600">{profile.targetProtein}g</span></div>
       </div>
    </Card>
    <Button fullWidth variant="outline" onClick={() => setProfile({...profile, onboarded: false})}>Reset Profile</Button>
  </div>
);

// --- Form Components Keep logic but minimal UI tweaks ---

const AddMealForm: React.FC<{ onSave: (foods: FoodItem[]) => void }> = ({ onSave }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        {COMMON_FOODS.slice(0, 4).map(f => (
          <button key={f.name} onClick={() => setFoods([...foods, f as FoodItem])} className="p-4 border border-slate-100 rounded-2xl text-left hover:bg-slate-50">
            <p className="font-bold text-sm">{f.name}</p>
            <p className="text-xs text-slate-400">{f.calories} kcal</p>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {foods.map((f, i) => <div key={i} className="flex justify-between text-sm font-bold bg-slate-50 p-3 rounded-xl"><span>{f.name}</span><span>{f.calories} kcal</span></div>)}
      </div>
      {foods.length > 0 && <Button fullWidth onClick={() => onSave(foods)}>Confirm Meal</Button>}
    </div>
  );
};

const AddWorkoutForm: React.FC<{ onSave: (w: Partial<Workout>) => void }> = ({ onSave }) => {
  const [duration, setDuration] = useState(30);
  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
         <label className="text-xs font-black text-slate-400 uppercase">Duration (min)</label>
         <input type="number" className="w-full text-4xl font-black outline-none" value={duration} onChange={e => setDuration(Number(e.target.value))} />
      </div>
      {/* Fix: Removed unsupported 'size' prop to match Button interface */}
      <Button fullWidth onClick={() => onSave({ duration, type: 'Strength', estimatedBurn: duration * 6 })}>Save Workout</Button>
    </div>
  );
};

export default App;
