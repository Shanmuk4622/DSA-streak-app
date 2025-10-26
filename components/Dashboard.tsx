import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, toDate } from 'date-fns';
import CalendarHeatmap from './CalendarHeatmap';

interface Profile {
  username: string | null;
  current_streak: number;
  longest_streak: number;
}

const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM10 18a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM3 10a7 7 0 1114 0 7 7 0 01-14 0z" />
    </svg>
);


const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.5,6H16V5a3,3,0,0,0-3-3H7A3,3,0,0,0,4,5V6H2.5A1.5,1.5,0,0,0,1,7.5v3A1.5,1.5,0,0,0,2.5,12H3v2.859a3,3,0,0,0,1.373,2.624l.53.353a3,3,0,0,0,3.194,0l.53-.353A3,3,0,0,0,10,14.859V12h0V12h0v2.859a3,3,0,0,0,1.373,2.624l.53.353a3,3,0,0,0,3.194,0l.53-.353A3,3,0,0,0,17,14.859V12h.5A1.5,1.5,0,0,0,19,10.5v-3A1.5,1.5,0,0,0,17.5,6ZM6,5A1,1,0,0,1,7,4h6a1,1,0,0,1,1,1V6H6Z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
)

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [submissions, setSubmissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, current_streak, longest_streak')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Ignore error for no rows found
                throw profileError;
            }
            setProfile(profileData);

            const { data: submissionData, error: submissionError } = await supabase
                .from('submissions')
                .select('date')
                .eq('user_id', user.id);

            if (submissionError) throw submissionError;

            const submissionDates = new Set(submissionData.map(s => s.date));
            setSubmissions(submissionDates);
            
            const todayUTC = format(new Date(), 'yyyy-MM-dd');
            setHasLoggedToday(submissionDates.has(todayUTC));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogToday = async () => {
        if (!user) return;
        setIsLogging(true);
        setError(null);
        
        const todayUTC = format(new Date(), 'yyyy-MM-dd');

        try {
            const { error: insertError } = await supabase.from('submissions').insert({
                user_id: user.id,
                date: todayUTC
            });

            if (insertError) {
                // Handle unique constraint violation (already logged today) gracefully
                if (insertError.code === '23505') {
                    setHasLoggedToday(true);
                } else {
                    throw insertError;
                }
            } else {
                 setHasLoggedToday(true);
            }
            // Re-fetch data to show updated streaks from the database function
            await fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLogging(false);
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">My DSA Journey</h1>
                <button onClick={signOut} className="text-sm font-medium text-gray-400 hover:text-white bg-gray-800/80 px-4 py-2 rounded-lg transition-colors border border-gray-700 hover:border-gray-600">
                    Sign Out
                </button>
            </header>
            
            {error && <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-md mb-6" role="alert">{error}</div>}

            <main>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl flex items-center space-x-4 border border-gray-700 transition-all duration-300 hover:border-amber-500/30 hover:bg-gray-800">
                        <FireIcon />
                        <div>
                            <p className="text-gray-400 text-sm">Current Streak</p>
                            <p className="text-4xl font-bold text-white">{profile?.current_streak ?? 0} days</p>
                        </div>
                    </div>
                    <div className="md:col-span-1 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl flex items-center space-x-4 border border-gray-700 transition-all duration-300 hover:border-yellow-400/30 hover:bg-gray-800">
                        <TrophyIcon />
                        <div>
                            <p className="text-gray-400 text-sm">Longest Streak</p>
                            <p className="text-4xl font-bold text-white">{profile?.longest_streak ?? 0} days</p>
                        </div>
                    </div>
                    <div className="md:col-span-1 bg-teal-800/30 border border-teal-600 p-6 rounded-xl flex items-center justify-center">
                        <button 
                            onClick={handleLogToday}
                            disabled={hasLoggedToday || isLogging}
                            className="w-full h-full text-lg font-bold bg-teal-600 text-white rounded-lg px-6 py-4 transition-transform transform hover:scale-105 disabled:bg-teal-800 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-70 flex items-center justify-center"
                        >
                            {isLogging ? <span className="w-5 h-5 border-2 border-dashed rounded-full animate-spin"></span> : (hasLoggedToday ? <><CheckIcon /> Completed!</> : "I Coded Today!")}
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Contribution Heatmap</h2>
                    <CalendarHeatmap submissionDates={submissions} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;