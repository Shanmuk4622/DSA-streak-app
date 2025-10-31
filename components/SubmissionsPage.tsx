import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Submission } from '../types';
import SubmissionModal from './SubmissionModal';
import SubmissionLog from './SubmissionLog';
import { format } from 'date-fns';

interface SubmissionsPageProps {
    submissions: Submission[];
    onDataRefresh: () => void;
}

const SubmissionsPage: React.FC<SubmissionsPageProps> = ({ submissions, onDataRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submissionToEdit, setSubmissionToEdit] = useState<Submission | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hasLoggedToday = useMemo(() => {
        const todayUTC = format(new Date(), 'yyyy-MM-dd');
        return submissions.some(s => s.date === todayUTC);
    }, [submissions]);

    const handleOpenEditModal = (submission: Submission) => {
        setSubmissionToEdit(submission);
        setIsModalOpen(true);
    };

    const handleOpenNewModal = () => {
        if (hasLoggedToday) return; // Safeguard in case button is not disabled
        setSubmissionToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSubmissionToEdit(null);
    };

    const handleDeleteSubmission = async (submissionId: number) => {
        if (window.confirm('Are you sure you want to delete this submission? This action may affect your streak and cannot be undone.')) {
            try {
                const { error: deleteError } = await supabase.from('submissions').delete().eq('id', submissionId);
                if (deleteError) throw deleteError;
                onDataRefresh();
            } catch (err: any) {
                setError(`Failed to delete submission: ${err.message}`);
            }
        }
    };

    return (
        <>
            <SubmissionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => {
                    handleCloseModal();
                    onDataRefresh();
                }}
                submissionToEdit={submissionToEdit}
            />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Submission History</h1>
                        <p className="text-gray-400 mt-1">Review and manage your logged problems.</p>
                    </div>
                    <button
                        onClick={handleOpenNewModal}
                        disabled={hasLoggedToday}
                        className="text-lg font-bold bg-teal-600 text-white rounded-lg px-6 py-3 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        {hasLoggedToday ? 'Completed Today!' : 'Log New Submission'}
                    </button>
                </header>

                {error && <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-md mb-6" role="alert">{error}</div>}

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                    <SubmissionLog submissions={submissions} onEdit={handleOpenEditModal} onDelete={handleDeleteSubmission} />
                </div>
            </div>
        </>
    );
};

export default SubmissionsPage;