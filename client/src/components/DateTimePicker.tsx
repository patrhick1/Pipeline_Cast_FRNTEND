// client/src/components/DateTimePicker.tsx

import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fromAPIDateTime, toAPIDateTime, getUserTimezone } from '@/lib/timezone';
import { Calendar, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import './DateTimePicker.css';

interface DateTimePickerProps {
  /** Field label */
  label: string;
  /** ISO 8601 DateTime string from API (YYYY-MM-DDTHH:mm:ss.sssZ) */
  value: string | null | undefined;
  /** Callback when DateTime changes, receives ISO 8601 string or null */
  onChange: (isoString: string | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Enable/disable time selection (default: true) */
  showTimeSelect?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Mark field as required */
  required?: boolean;
  /** Help text displayed below the input */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DateTimePicker component for selecting dates and times
 * Handles automatic conversion between user's local timezone and UTC for API
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date and time',
  minDate,
  maxDate,
  showTimeSelect = true,
  disabled = false,
  required = false,
  helpText,
  error,
  className = '',
}) => {
  // Convert ISO string from API to Date object for DatePicker
  const selectedDate = fromAPIDateTime(value);

  // Separate state for time input
  const [timeValue, setTimeValue] = useState(() => {
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '09:00';
  });

  // Handle date change from calendar picker
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange(null);
      return;
    }

    // Apply the current time to the selected date
    const [hours, minutes] = timeValue.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    const isoString = toAPIDateTime(date);
    onChange(isoString);
  };

  // Handle time change from time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (!selectedDate) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);

    const isoString = toAPIDateTime(newDate);
    onChange(isoString);
  };

  const userTimezone = getUserTimezone();

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {/* Label */}
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        {showTimeSelect ? (
          <Clock className="w-4 h-4 text-gray-500" />
        ) : (
          <Calendar className="w-4 h-4 text-gray-500" />
        )}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Date and Time Inputs */}
      <div className="flex gap-2">
        {/* Date Picker */}
        <div className="flex-1 relative">
          <ReactDatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MMM d, yyyy"
            placeholderText={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-gray-300'}
              text-sm
            `}
            wrapperClassName="w-full"
            calendarClassName="simple-calendar shadow-lg border border-gray-200 rounded-lg"
            isClearable
            showPopperArrow={false}
            popperPlacement="bottom-start"
            portalId="root-portal"
            popperModifiers={[
              {
                name: 'preventOverflow',
                options: {
                  rootBoundary: 'viewport',
                  tether: false,
                  altAxis: true,
                },
              },
            ]}
          />
        </div>

        {/* Time Input - Only show if showTimeSelect is true */}
        {showTimeSelect && (
          <div className="w-28">
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              className={`
                h-[42px] text-sm
                ${error ? 'border-red-500' : ''}
              `}
            />
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>{helpText}</span>
          {showTimeSelect && (
            <span className="text-gray-400">({userTimezone})</span>
          )}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Simple DatePicker without time selection (convenience wrapper)
 */
export const DatePicker: React.FC<Omit<DateTimePickerProps, 'showTimeSelect'>> = (props) => {
  return <DateTimePicker {...props} showTimeSelect={false} />;
};
