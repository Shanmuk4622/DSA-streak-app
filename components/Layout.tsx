import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Submission } from '../types';

import Dashboard from './Dashboard';
import SubmissionsPage from './SubmissionsPage';
import ProfilePage from './ProfilePage';

type View = 'dashboard' | 'submissions' | 'profile';

// Fix: Changed component definition to use a standard interface and React.FC for better type inference.
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
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            setProfile(profileData);

            const { data: submissionData, error: submissionError } = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            if (submissionError) throw submissionError;
            setSubmissions(submissionData);

        } catch (err: any) {
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
                    <button onClick={() => setActiveView('submissions')} className="p-2 rounded-lg group transition-colors">
                         <NavIcon isActive={activeView === 'submissions'}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </NavIcon>
                    </button>
                    <button onClick={() => setActiveView('profile')} className="p-2 rounded-lg group transition-colors">
                        <NavIcon isActive={activeView === 'profile'}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </NavIcon>
                    </button>
                 </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

export default Layout;