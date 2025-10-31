import React, { useMemo } from 'react';
import CalendarHeatmap from './CalendarHeatmap';
import { Profile, Submission } from '../types';
import { format, parseISO } from 'date-fns';

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

interface DashboardProps {
    profile: Profile | null;
    submissions: Submission[];
}

const Dashboard: React.FC<DashboardProps> = ({ profile, submissions }) => {
    const submissionDates = useMemo(() => new Set(submissions.map(s => format(parseISO(s.created_at), 'yyyy-MM-dd'))), [submissions]);
    
    const hasLoggedToday = useMemo(() => {
        const todayUTC = format(new Date(), 'yyyy-MM-dd');
        return submissionDates.has(todayUTC);
    }, [submissionDates]);
    
    const difficultyCounts = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        submissions.forEach(s => {
            if (counts[s.difficulty] !== undefined) {
               counts[s.difficulty]++;
            }
        });
        return [
            { name: 'Easy', value: counts.Easy, color: '#22c55e' }, // green-500
            { name: 'Medium', value: counts.Medium, color: '#eab308' }, // yellow-500
            { name: 'Hard', value: counts.Hard, color: '#ef4444' }, // red-500
        ];
    }, [submissions]);


    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
                    {profile?.username ? `Welcome back, ${profile.username}!` : 'Welcome to your DSA Journey'}
                </h1>
                <p className="text-gray-400 mt-1">Here's a snapshot of your progress.</p>
            </header>
            
            <main>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl flex items-center space-x-4 border border-gray-700 transition-all duration-300 hover:border-amber-500/30 hover:bg-gray-800">
                        <FireIcon />
                        <div>
                            <p className="text-gray-400 text-sm">Current Streak</p>
                            <p className="text-4xl font-bold text-white">{profile?.current_streak ?? 0} days</p>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl flex items-center space-x-4 border border-gray-700 transition-all duration-300 hover:border-yellow-400/30 hover:bg-gray-800">
                        <TrophyIcon />
                        <div>
                            <p className="text-gray-400 text-sm">Longest Streak</p>
                            <p className="text-4xl font-bold text-white">{profile?.longest_streak ?? 0} days</p>
                        </div>
                    </div>
                    <div className={`p-6 rounded-xl flex items-center justify-center border ${hasLoggedToday ? 'bg-teal-800/30 border-teal-600' : 'bg-gray-800/50 border-gray-700'}`}>
                        <div className="text-center">
                            {hasLoggedToday ? (
                                <div className="flex items-center text-lg font-bold text-teal-300">
                                    <CheckIcon />
                                    <span>Completed Today!</span>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg font-bold text-gray-200">Log today's progress</p>
                                    <p className="text-sm text-gray-400">Head to the Submissions tab.</p>
                                 </div>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                    <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-bold mb-4">Contribution Heatmap</h2>
                        <CalendarHeatmap submissionDates={submissionDates} />
                    </div>
                     <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                         <h2 className="text-xl font-bold mb-4">Progress Snapshot</h2>
                         <PieChart data={difficultyCounts} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;