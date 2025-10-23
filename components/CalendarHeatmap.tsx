
import React, { useState, useRef } from 'react';
import { format, startOfDay, addDays, getDay, differenceInDays } from 'date-fns';

interface CalendarHeatmapProps {
  submissionDates: Set<string>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ submissionDates }) => {
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, date: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());
  const yearAgo = addDays(today, -364);

  const days = Array.from({ length: 365 }, (_, i) => addDays(yearAgo, i));
  const firstDayOffset = getDay(yearAgo);

  const handleMouseEnter = (day: Date, e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({
        show: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        date: format(day, 'MMMM d, yyyy'),
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };
  
  const getIntensityClass = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    if (submissionDates.has(formattedDate)) {
        return 'bg-emerald-500'; // Active day
    }
    return 'bg-gray-700'; // Inactive day
  };

  return (
    <div ref={containerRef} className="relative">
      {tooltip.show && (
        <div
          className="tooltip"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y - 30}px`,
            visibility: 'visible',
            opacity: 1,
          }}
        >
          {tooltip.date}
        </div>
      )}
      <div className="flex justify-between text-xs text-gray-400 mb-2 px-2">
         <span>{format(yearAgo, 'MMM')}</span>
         <span></span><span></span><span></span>
         <span>{format(addDays(yearAgo, 90), 'MMM')}</span>
         <span></span><span></span><span></span>
         <span>{format(addDays(yearAgo, 180), 'MMM')}</span>
         <span></span><span></span><span></span>
         <span>{format(addDays(yearAgo, 270), 'MMM')}</span>
         <span></span>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ))}
        {days.map((day) => {
          const isFuture = differenceInDays(day, today) > 0;
          if (isFuture) return null;
          
          return (
            <div
              key={day.toString()}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${getIntensityClass(day)}`}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>
      <div className="flex justify-end items-center mt-4 text-xs text-gray-500 space-x-2">
          <span>Less</span>
          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
          <span>More</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
