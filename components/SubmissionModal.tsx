import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, Submission } from '../types';

type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submissionToEdit?: Submission | null;
}

const INITIAL_FORM_STATE: Partial<SubmissionInsert> = {
    problem_name: '',
    link: '',
    difficulty: 'Medium',
    platform: '',
    description: '',
};

const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose, onSuccess, submissionToEdit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<SubmissionInsert | SubmissionUpdate>>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<React.ReactNode | null>(null);


  const isEditMode = !!submissionToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            setFormData({
                problem_name: submissionToEdit.problem_name,
                link: submissionToEdit.link,
                difficulty: submissionToEdit.difficulty,
                platform: submissionToEdit.platform,
                description: submissionToEdit.description,
            });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }
        setError(null); // Reset error on open
        setErrorDetails(null);
    }
  }, [isOpen, isEditMode, submissionToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !formData.problem_name || !formData.difficulty) {
      setError('Problem Name and Difficulty are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      if (isEditMode) {
        // Update existing submission
        const submissionUpdateData: SubmissionUpdate = {
            problem_name: formData.problem_name,
            difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
            link: formData.link || null,
            platform: formData.platform || null,
            description: formData.description || null,
        };
        const { error: updateError } = await supabase
            .from('submissions')
            .update(submissionUpdateData)
            .eq('id', submissionToEdit.id);
        if (updateError) throw updateError;

      } else {
        // Create new submission.
        const submissionInsertData: SubmissionInsert = {
          user_id: user.id,
          date: new Date().toISOString(),
          problem_name: formData.problem_name!,
          difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
          link: formData.link || null,
          platform: formData.platform || null,
          description: formData.description || null,
        };

        const { error: insertError } = await supabase.from('submissions').insert([submissionInsertData]);
        
        if (insertError) {
            throw insertError;
        }
      }
      onSuccess();
    } catch (err: any) {
      console.error("Submission failed:", err);
      if (err.code === '23505') { // Unique constraint violation
        setError("Multiple Submissions Blocked by Database Rule");
        setErrorDetails(
            <div className="mt-2 text-left bg-gray-900/50 p-4 rounded-md border border-red-500/30">
                <p className="text-gray-300 text-sm">Your Supabase table has a unique constraint that prevents more than one submission per day.</p>
                <p className="text-gray-300 text-sm mt-2 font-medium">To fix this permanently, please run this SQL command in your Supabase SQL Editor:</p>
                <pre className="bg-gray-950 text-emerald-300 p-2 rounded-md mt-2 text-xs overflow-x-auto">
                    <code>ALTER TABLE public.submissions DROP CONSTRAINT submissions_user_id_date_key;</code>
                </pre>
            </div>
        );
      } else {
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">{isEditMode ? 'Edit Submission' : 'Log Your Progress'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="problem_name" className="block text-sm font-medium text-gray-300">Problem Name</label>
            <input type="text" name="problem_name" id="problem_name" required value={formData.problem_name || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300">Difficulty</label>
                <select name="difficulty" id="difficulty" required value={formData.difficulty} onChange={handleChange} className="mt-1 block w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>
            </div>
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-300">Platform</label>
              <input type="text" name="platform" id="platform" placeholder="e.g., LeetCode" value={formData.platform || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>
          </div>
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-300">Link</label>
            <input type="url" name="link" id="link" placeholder="https://..." value={formData.link || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Notes / Description</label>
            <textarea name="description" id="description" rows={3} value={formData.description || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-900/70 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"></textarea>
          </div>
          
          {error && <div className="text-red-400 text-sm text-center font-semibold">{error}</div>}
          {errorDetails}
          
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/80 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800 disabled:bg-teal-800 disabled:cursor-not-allowed">
              {loading ? <span className="w-5 h-5 border-2 border-dashed rounded-full animate-spin inline-block"></span> : (isEditMode ? 'Save Changes' : 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionModal;