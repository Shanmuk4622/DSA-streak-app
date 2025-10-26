import React from 'react';
import AuthComponent from './Auth';

const FeatureCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 text-center backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:bg-gray-800/70">
        <h3 className="text-xl font-bold text-teal-400 mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="text-center max-w-4xl mx-auto my-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    Chart Your Celestial Journey
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                    Transform daily discipline into a constellation of achievements. Track your Data Structures & Algorithms progress, build an unbreakable streak, and watch your skills ascend.
                </p>
            </div>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
                <FeatureCard title="Build Your Streak">
                    Consistency is key. Log your daily progress and watch your motivational streak catch fire.
                </FeatureCard>
                <FeatureCard title="Visualize Your Path">
                    Our contribution heatmap turns your hard work into a stunning visual map of your journey.
                </FeatureCard>
                <FeatureCard title="Log Every Detail">
                    Track problem names, difficulty, platforms, and personal notes for a complete history.
                </FeatureCard>
            </div>

            {/* Auth Component is the CTA */}
            <div className="w-full max-w-md">
                <AuthComponent />
            </div>

            <footer className="mt-16 mb-8 text-center text-gray-500 text-sm">
                <p>Begin your ascent. The stars await.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
