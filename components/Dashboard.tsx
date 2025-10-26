import React, { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import CalendarHeatmap from './CalendarHeatmap';
import SubmissionModal from './SubmissionModal';
import SubmissionLog from './SubmissionLog';
import { Database } from '../types';

type Profile = Database['public']['Tables']['profiles']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];

const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a4.5 4.5 0 014.5 4.5v1.5a1.5 1.5 0 01-3 0V17.25a.75.75 0 00-1.5 0v1.5a1.5 1.5 0 01-3 0V17.25a4.5 4.5 0 014.5-4.5z" />
    </svg>
);

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 01-4.5-1.95V12.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v3.975c-1.594.92-3.46.92-5.054 0zM9 13.5V9A3 3 0 0112 6v3.75m3-3.75V9A3 3 0 0012 6" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
)

const PieChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No submission data yet.</div>;
    }
    
    let cumulative = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="flex items-center justify-center space-x-6">
            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                {data.map((item, index) => {
                    const dasharray = (item.value / total) * circumference;
                    const dashoffset = (cumulative / total) * circumference;
                    cumulative += item.value;
                    return (
                        <circle
                            key={index}
                            r={radius}
                            cx="50"
                            cy="50"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${dasharray} ${circumference}`}
                            strokeDashoffset={-dashoffset}
                        />
                    );
                })}
            </svg>
            <div className="text-sm space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-300">{item.name}</span>
                        <span className="ml-auto text-gray-400 font-mono">({item.value})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [submissionDates, setSubmissionDates] = useState<Set<string>>(new Set());
    const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submissionToEdit, setSubmissionToEdit] = useState<Submission | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

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

            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            if (profileData) {
                setProfile(profileData);
                setNewUsername(profileData.username || '');
            }

            const { data: submissionData, error: submissionError } = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (submissionError) throw submissionError;

            const dates = new Set(submissionData.map(s => s.date));
            setSubmissionDates(dates);
            setSubmissionHistory(submissionData);
            
            const todayUTC = format(new Date(), 'yyyy-MM-dd');
            setHasLoggedToday(dates.has(todayUTC));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenEditModal = (submission: Submission) => {
        setSubmissionToEdit(submission);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSubmissionToEdit(null);
    };

    const handleDeleteSubmission = async (submissionId: number) => {
        if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
            try {
                const { error: deleteError } = await supabase.from('submissions').delete().eq('id', submissionId);
                if (deleteError) throw deleteError;
                // Note: The streak logic is handled by a backend trigger. Deleting may not automatically reverse a streak.
                // For this project, we'll just refetch the data.
                await fetchData();
            } catch (err: any) {
                setError(`Failed to delete submission: ${err.message}`);
            }
        }
    };
    
    const difficultyCounts = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        submissionHistory.forEach(s => {
            counts[s.difficulty]++;
        });
        return [
            { name: 'Easy', value: counts.Easy, color: '#22c55e' }, // green-500
            { name: 'Medium', value: counts.Medium, color: '#eab308' }, // yellow-500
            { name: 'Hard', value: counts.Hard, color: '#ef4444' }, // red-500
        ];
    }, [submissionHistory]);


    const handleUsernameUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !newUsername.trim() || newUsername === profile?.username) {
            return;
        }

        setIsUpdating(true);
        setUpdateMessage('');

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: newUsername.trim() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setUpdateMessage('Username updated successfully!');
            await fetchData(); // Refresh data to show new username in header
        } catch (err: any) {
            setUpdateMessage(`Error: ${err.message}`);
        } finally {
            setIsUpdating(false);
            setTimeout(() => setUpdateMessage(''), 3000); // Clear message after 3 seconds
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div></div>;
    }

    return (
        <>
            <SubmissionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => {
                    handleCloseModal();
                    fetchData(); // Refresh all data on new submission
                }}
                submissionToEdit={submissionToEdit}
            />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
                        {profile?.username ? `${profile.username}'s DSA Journey` : 'My DSA Journey'}
                    </h1>
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
                                onClick={() => setIsModalOpen(true)}
                                disabled={hasLoggedToday}
                                className="w-full h-full text-lg font-bold bg-teal-600 text-white rounded-lg px-6 py-4 transition-transform transform hover:scale-105 disabled:bg-teal-800 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-70 flex items-center justify-center"
                            >
                                {hasLoggedToday ? <><CheckIcon /> Completed Today!</> : "Log New Submission"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                         <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                            <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
                            <form onSubmit={handleUsernameUpdate} className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-full sm:w-auto flex-grow">
                                        <label htmlFor="username" className="sr-only">Username</label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            className="w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUpdating || newUsername.trim() === (profile?.username || '') || !newUsername.trim()}
                                        className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? 'Saving...' : 'Save Username'}
                                    </button>
                                </div>
                                 {updateMessage && <p className={`text-sm mt-2 ${updateMessage.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{updateMessage}</p>}
                            </form>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                             <h2 className="text-xl font-bold mb-4">Progress Snapshot</h2>
                             <PieChart data={difficultyCounts} />
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8">
                        <h2 className="text-xl font-bold mb-4">Contribution Heatmap</h2>
                        <CalendarHeatmap submissionDates={submissionDates} />
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-bold mb-4">Submission Log</h2>
                        <SubmissionLog submissions={submissionHistory} onEdit={handleOpenEditModal} onDelete={handleDeleteSubmission} />
                    </div>
                </main>
            </div>
        </>
    );
};

export default Dashboard;