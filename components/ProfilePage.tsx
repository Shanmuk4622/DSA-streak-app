import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';

interface ProfilePageProps {
    profile: Profile | null;
    user: User | null;
    totalSubmissions: number;
    onDataRefresh: () => void;
    onSignOut: () => void;
}

const getInitials = (name?: string | null, email?: string | null): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
};


const ProfilePage: React.FC<ProfilePageProps> = ({ profile, user, totalSubmissions, onDataRefresh, onSignOut }) => {
    const [newUsername, setNewUsername] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    
    const [streakGoal, setStreakGoal] = useState<number>(30);
    const [isGoalUpdating, setIsGoalUpdating] = useState(false);
    const [goalUpdateMessage, setGoalUpdateMessage] = useState('');


    useEffect(() => {
        if (profile) {
            setNewUsername(profile.username || '');
            setStreakGoal(profile.streak_goal || 30);
        }
    }, [profile]);

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
            onDataRefresh();
        } catch (err: any) {
            console.error("Error updating username:", err);
            setUpdateMessage(`Error: ${err.message}`);
        } finally {
            setIsUpdating(false);
            setTimeout(() => setUpdateMessage(''), 3000);
        }
    };
    
    const handleGoalUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || streakGoal < 1 || streakGoal === profile?.streak_goal) {
            return;
        }

        setIsGoalUpdating(true);
        setGoalUpdateMessage('');

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ streak_goal: streakGoal })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setGoalUpdateMessage('Streak goal updated!');
            onDataRefresh();
        } catch (err: any) {
            console.error("Error updating streak goal:", err);
            setGoalUpdateMessage(`Error: ${err.message}`);
        } finally {
            setIsGoalUpdating(false);
            setTimeout(() => setGoalUpdateMessage(''), 3000);
        }
    }

    const cardStyles = "bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700";
    
    const currentStreak = profile?.current_streak ?? 0;
    const goal = profile?.streak_goal ?? 30;
    const progressPercentage = goal > 0 ? Math.min(100, (currentStreak / goal) * 100) : 0;


    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">My Profile</h1>
                <p className="text-gray-400 mt-1">Your personal DSA journey dashboard.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className={cardStyles}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-teal-500/20 flex items-center justify-center mb-4 border-2 border-teal-500">
                                <span className="text-4xl font-bold text-teal-300">{getInitials(profile?.username, user?.email)}</span>
                            </div>
                            <h2 className="text-xl font-bold text-white truncate">{profile?.username || 'Anonymous User'}</h2>
                            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Member since {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '...'}
                            </p>
                        </div>
                    </div>
                    <div className={cardStyles}>
                         <h3 className="text-lg font-bold mb-4 text-gray-200">Statistics</h3>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Current Streak</span>
                                <span className="font-bold text-white text-lg">{profile?.current_streak ?? 0} days</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-400">Longest Streak</span>
                                <span className="font-bold text-white text-lg">{profile?.longest_streak ?? 0} days</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-400">Total Submissions</span>
                                <span className="font-bold text-white text-lg">{totalSubmissions}</span>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                     <div className={cardStyles}>
                        <h3 className="text-lg font-bold mb-4 text-gray-200">Update Username</h3>
                        <form onSubmit={handleUsernameUpdate} className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <input
                                        id="username"
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isUpdating || newUsername.trim() === (profile?.username || '') || !newUsername.trim()}
                                        className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 focus:ring-offset-gray-800 disabled:bg-gray-700 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                            {updateMessage && <p className={`text-sm mt-2 ${updateMessage.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{updateMessage}</p>}
                        </form>
                    </div>

                    <div className={cardStyles}>
                        <h3 className="text-lg font-bold text-gray-200">Streak Goal</h3>
                        <div className="my-4">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-base font-medium text-teal-300">Progress</span>
                                <span className="text-sm font-medium text-gray-400">
                                    {currentStreak} / {goal} days
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                        <form onSubmit={handleGoalUpdate} className="mt-6">
                             <label htmlFor="streak_goal" className="block text-sm font-medium text-gray-400 mb-1">Set new goal</label>
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <input
                                    id="streak_goal"
                                    type="number"
                                    min="1"
                                    value={streakGoal}
                                    onChange={(e) => setStreakGoal(Number(e.target.value))}
                                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isGoalUpdating || streakGoal === (profile?.streak_goal || 30) || streakGoal < 1}
                                    className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 focus:ring-offset-gray-800 disabled:bg-teal-800 disabled:cursor-not-allowed"
                                >
                                    {isGoalUpdating ? 'Saving...' : 'Set Goal'}
                                </button>
                            </div>
                            {goalUpdateMessage && <p className={`text-sm mt-2 ${goalUpdateMessage.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{goalUpdateMessage}</p>}
                        </form>
                    </div>
                    
                    <div className={cardStyles}>
                         <h3 className="text-lg font-bold mb-4 text-gray-200">Account Actions</h3>
                         <button 
                            onClick={onSignOut} 
                            className="text-sm font-medium text-red-300 hover:text-red-200 bg-red-600/20 px-4 py-2 rounded-lg transition-colors border border-red-500/50 hover:border-red-500/80"
                         >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;