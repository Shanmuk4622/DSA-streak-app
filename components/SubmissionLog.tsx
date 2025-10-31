import React from 'react';
import { format, parseISO } from 'date-fns';
import { Submission } from '../types';

interface SubmissionLogProps {
  submissions: Submission[];
  onEdit: (submission: Submission) => void;
}

const DifficultyBadge: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
  const colorClasses = {
    Easy: 'bg-green-600/20 text-green-300 border-green-500/30',
    Medium: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    Hard: 'bg-red-600/20 text-red-300 border-red-500/30',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${colorClasses[difficulty]}`}>
      {difficulty}
    </span>
  );
};


const SubmissionLog: React.FC<SubmissionLogProps> = ({ submissions, onEdit }) => {
  if (submissions.length === 0) {
    return <p className="text-center text-gray-400 py-8">You haven't logged any submissions yet. Add one to get started!</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/60">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Date</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Problem</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Difficulty</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">Platform</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden lg:table-cell">Link</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-400 sm:pl-6">
                {format(parseISO(submission.created_at), 'MMM d, yyyy')}
              </td>
              <td className="px-3 py-4 text-sm text-gray-200">
                <div className="whitespace-pre-wrap font-medium">{submission.problem_name}</div>
                {submission.description && (
                  <div className="text-gray-400 mt-1 text-xs whitespace-pre-wrap hidden sm:block">
                     {submission.description.substring(0, 100)}{submission.description.length > 100 && '...'}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                <DifficultyBadge difficulty={submission.difficulty} />
              </td>
              <td className="px-3 py-4 text-sm text-gray-400 hidden md:table-cell">{submission.platform}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 hidden lg:table-cell">
                {submission.link ? (
                  <a href={submission.link} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">
                    View
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                <button onClick={() => onEdit(submission)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionLog;