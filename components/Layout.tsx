import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Submission } from '../types';
import { startOfDay, parseISO, differenceInDays, format } from 'date-fns';

import Dashboard from './Dashboard';
import SubmissionsPage from './SubmissionsPage';
import ProfilePage from './ProfilePage';

type View = 'dashboard' | 'submissions' | 'profile';

/**
 * Calculates the current and longest streaks based on a list of submission dates.
 * This function is robust and recalculates from scratch.
 */
const calculateStreaks = (submissionDates: string[]): { currentStreak: number; longestStreak: number } => {
    if (!submissionDates || submissionDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // 1. Get unique, sorted dates. Parsing them ensures they are treated consistently.
    const dates = [
        ...new Set(submissionDates.map(d => format(parseISO(d), 'yyyy-MM-dd')))
    ]
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime()); // Sort ascending

    if (dates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // 2. Calculate longest streak
    let longestStreak = 0;
    if (dates.length > 0) {
        longestStreak = 1;
        let currentRun = 1;
        for (let i = 1; i < dates.length; i++) {
            // Check if the current date is exactly one day after the previous one
            if (differenceInDays(dates[i], dates[i - 1]) === 1) {
                currentRun++;
            } else {
                longestStreak = Math.max(longestStreak, currentRun);
                currentRun = 1; // Reset for the new run
            }
        }
        longestStreak = Math.max(longestStreak, currentRun); // Check the last run
    }

    // 3. Calculate current streak
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const lastSubmissionDate = dates[dates.length - 1];
    
    // Streak is only "current" if the last submission was today or yesterday.
    if (differenceInDays(today, lastSubmissionDate) <= 1) {
        currentStreak = 1;
        // Go backwards from the most recent submission
        for (let i = dates.length - 2; i >= 0; i--) {
            if (differenceInDays(dates[i + 1], dates[i]) === 1) {
                currentStreak++;
            } else {
                break; // Streak is broken
            }
        }
    }
    
    return { currentStreak, longestStreak };
};


interface NavIconProps {
    children: React.ReactNode;
    isActive: boolean;
}

const NavIcon: React.FC<NavIconProps> = ({ children, isActive }) => (
    <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-teal-500 text-white' : 'text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-200'}`}>
        {children}
    </div>
);

const Layout: React.FC = () => {
    const { user, signOut } = useAuth();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            let profileData: Profile | null = null;
    
            const { data: existingProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
    
            if (profileError && profileError.code === 'PGRST116') {
                // Profile does not exist, create it. This is expected for new users.
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
                        current_streak: 0,
                        longest_streak: 0,
                        streak_goal: 30,
                    })
                    .select()
                    .single();
    
                if (insertError) {
                    console.error("Error creating profile:", insertError);
                    throw insertError;
                }
                profileData = newProfile;
            } else if (profileError) {
                // A different error occurred while fetching profile
                throw profileError;
            } else {
                // Profile found successfully
                profileData = existingProfile;
            }
    
            const { data: submissionData, error: submissionError } = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (submissionError) throw submissionError;
    
            // --- Robust Streak Calculation ---
            if (profileData && submissionData) {
                const submissionDates = submissionData.map(s => s.created_at);
                const { currentStreak, longestStreak } = calculateStreaks(submissionDates);
    
                // If calculated streaks differ from DB, update the DB.
                if (profileData.current_streak !== currentStreak || profileData.longest_streak !== longestStreak) {
                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ current_streak: currentStreak, longest_streak: longestStreak })
                        .eq('id', user.id)
                        .select()
                        .single();
    
                    if (updateError) {
                        console.error("Failed to update streaks:", updateError.message);
                    } else {
                        // Mutate profileData for immediate UI update
                        profileData = updatedProfile;
                    }
                }
            }
            // --- End of Streak Logic ---
    
            setProfile(profileData);
            setSubmissions(submissionData || []);
    
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderView = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div></div>;
        }
        if (error) {
            return <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-md m-4" role="alert">{error}</div>;
        }
        switch (activeView) {
            case 'dashboard':
                return <Dashboard profile={profile} submissions={submissions} />;
            case 'submissions':
                return <SubmissionsPage submissions={submissions} onDataRefresh={fetchData} />;
            case 'profile':
                return (
                    <ProfilePage 
                        profile={profile} 
                        user={user}
                        totalSubmissions={submissions.length}
                        onDataRefresh={fetchData} 
                        onSignOut={signOut} 
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900">
            <aside className="w-20 bg-gray-800/50 border-r border-gray-700 p-2 flex flex-col items-center space-y-4">
                 <h1 className="text-xl font-bold text-teal-400 mt-2">DSA</h1>
                 <div className="flex flex-col space-y-2 mt-8">
                    <button onClick={() => setActiveView('dashboard')} className="p-2 rounded-lg group transition-colors">
                        <NavIcon isActive={activeView === 'dashboard'}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </NavIcon>
                    </button>
                    <div className="relative">
                        <button onClick={() => setActiveView('submissions')} className="p-2 rounded-lg group transition-colors">
                             <NavIcon isActive={activeView === 'submissions'}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </NavIcon>
                        </button>
                        {!loading && submissions.length > 0 && (
                            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-teal-600 rounded-full border-2 border-gray-800">
                                {submissions.length}
                            </span>
                        )}
                    </div>
                    <button onClick={() => setActiveView('profile')} className="p-2 rounded-lg group transition-colors">
                        <NavIcon isActive={activeView === 'profile'}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </NavIcon>
                    </button>
                 </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
                <footer className="text-center py-3 px-4 text-gray-500 text-sm border-t border-gray-700 bg-gray-900">
                    Every problem solved is another star in your constellation of knowledge.
                </footer>
            </div>
        </div>
    );
};

export default Layout;