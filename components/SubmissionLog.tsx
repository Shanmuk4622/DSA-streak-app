import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Submission } from '../types';

interface SubmissionLogProps {
  submissions: Submission[];
  onEdit: (submission: Submission) => void;
  onDelete: (submissionId: number) => void;
}

const difficultyColors: { [key in Submission['difficulty']]: string } = {
  Easy: 'bg-green-600/30 text-green-300 border-green-500/50',
  Medium: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50',
  Hard: 'bg-red-600/30 text-red-300 border-red-500/50',
};

const SubmissionLog: React.FC<SubmissionLogProps> = ({ submissions, onEdit, onDelete }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      if (sortOrder === 'asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }, [submissions, sortOrder]);

  if (submissions.length === 0) {
    return <p className="text-center text-gray-400">You haven't logged any submissions yet. Log one to get started!</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/60">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Problem</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Difficulty</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">Platform</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center group focus:outline-none hover:text-white transition-colors"
              >
                <span>Date</span>
                <span className="ml-1 text-gray-500 group-hover:text-white transition-colors">
                  {sortOrder === 'desc' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </span>
              </button>
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-900/50">
          {sortedSubmissions.map((submission) => (
            <tr key={submission.id} className="border-l-2 border-transparent hover:border-teal-500 hover:bg-gray-800/40 transition-all duration-200">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                {submission.link ? (
                  <a href={submission.link} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors inline-flex items-center group">
                    {submission.problem_name}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1.5 text-gray-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ) : (
                  submission.problem_name
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[submission.difficulty]}`}>
                  {submission.difficulty}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 hidden md:table-cell">{submission.platform || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{format(parseISO(submission.date), 'MMM d, yyyy')}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                <button onClick={() => onEdit(submission)} className="text-teal-400 hover:text-teal-300 hover:underline transition-colors">Edit</button>
                <button onClick={() => onDelete(submission.id)} className="text-red-400 hover:text-red-300 hover:underline transition-colors">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionLog;