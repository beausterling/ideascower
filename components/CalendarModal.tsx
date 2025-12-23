import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  availableDates: string[]; // Array of date strings in YYYY-MM-DD format
  currentDate: Date;
  launchDate: Date;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  availableDates,
  currentDate,
  launchDate
}) => {
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setViewMonth(new Date(currentDate));
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Navigate months
  const goToPreviousMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setViewMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    const today = new Date();
    // Don't go beyond current month
    if (newMonth <= today) {
      setViewMonth(newMonth);
    }
  };

  // Check if a date has an idea
  const hasIdea = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availableDates.includes(dateStr);
  };

  // Check if a date is in the past (before launch)
  const isBeforeLaunch = (day: number): boolean => {
    const dateToCheck = new Date(year, month, day);
    return dateToCheck < launchDate;
  };

  // Check if a date is in the future
  const isFutureDate = (day: number): boolean => {
    const dateToCheck = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateToCheck > today;
  };

  // Check if it's the current selected date
  const isSelectedDate = (day: number): boolean => {
    const dateToCheck = new Date(year, month, day);
    return dateToCheck.toDateString() === currentDate.toDateString();
  };

  const handleDateClick = (day: number) => {
    if (isBeforeLaunch(day) || isFutureDate(day)) return;
    const selectedDate = new Date(year, month, day);
    onSelectDate(selectedDate);
    onClose();
  };

  // Build calendar grid
  const calendarDays = [];

  // Empty cells before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const disabled = isBeforeLaunch(day) || isFutureDate(day);
    const hasRedDot = hasIdea(day);
    const isSelected = isSelectedDate(day);

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        disabled={disabled}
        className={`
          aspect-square relative flex flex-col items-center justify-center
          font-mono text-sm transition-all
          ${disabled
            ? 'text-gray-700 cursor-not-allowed'
            : 'text-gray-300 hover:bg-tower-gray/30 hover:text-white cursor-pointer'
          }
          ${isSelected ? 'bg-tower-accent/20 ring-1 ring-tower-accent text-white' : ''}
          ${hasRedDot && !disabled ? 'font-bold' : ''}
        `}
      >
        <span className="relative z-10">{day}</span>
        {hasRedDot && !disabled && (
          <div className="absolute bottom-1 w-1.5 h-1.5 bg-tower-accent rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const canGoBack = viewMonth > launchDate;
  const canGoForward = viewMonth < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-tower-dark border border-tower-gray max-w-md w-full rounded-sm shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tower-gray">
          <h2 className="text-xl font-serif text-white">Idea Archive</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoBack}
              className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-sm uppercase tracking-wider text-gray-300">
              {monthNames[month]} {year}
            </h3>

            <button
              onClick={goToNextMonth}
              disabled={!canGoForward}
              className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-mono text-gray-600 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-tower-gray flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-tower-accent rounded-full" />
              <span className="text-gray-400 font-mono">Has Idea</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <span className="text-gray-400 font-mono">No Idea</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
