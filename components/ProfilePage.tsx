import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

interface ProfilePageProps {
    profile: Profile | null;
    onDataRefresh: () => void;
    onSignOut: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onDataRefresh, onSignOut }) => {
    const { user } = useAuth();
    const [newUsername, setNewUsername] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        if (profile) {
            setNewUsername(profile.username || '');
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
            setUpdateMessage(`Error: ${err.message}`);
        } finally {
            setIsUpdating(false);
            setTimeout(() => setUpdateMessage(''), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Profile Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account details.</p>
            </header>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8">
                <h2 className="text-xl font-bold mb-4">Update Username</h2>
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
                 <h2 className="text-xl font-bold mb-4">Account Actions</h2>
                 <button 
                    onClick={onSignOut} 
                    className="text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/30 px-4 py-2 rounded-lg transition-colors border border-red-700 hover:border-red-600"
                 >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;
