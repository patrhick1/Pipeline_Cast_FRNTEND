import React from 'react';
import { format } from 'date-fns';
import { Calendar, Phone, Mic, Radio, DollarSign, FileText, Check, X, Bell } from 'lucide-react';
import { formatDateTime, fromAPIDateTime, isUpcoming, getDateTimeDescription } from '@/lib/timezone';

interface TimelineEvent {
  date: string | null;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'upcoming' | 'missed';
}

interface Placement {
  placement_id: number;
  created_at: string;
  meeting_date?: string | null; // ISO 8601 DateTime
  call_date?: string | null; // ISO 8601 DateTime
  recording_date?: string | null; // ISO 8601 DateTime
  go_live_date?: string | null; // ISO 8601 DateTime
  follow_up_date?: string | null; // ISO 8601 DateTime - NEW
  current_status?: string | null;
  episode_link?: string | null;
}

interface PlacementTimelineProps {
  placement: Placement;
}

export const PlacementTimeline: React.FC<PlacementTimelineProps> = ({ placement }) => {
  const now = new Date();

  const getEventStatus = (isoDate: string | null, isCompleted: boolean): 'completed' | 'upcoming' | 'missed' => {
    if (!isoDate) return 'upcoming';
    if (isCompleted) return 'completed';

    const eventDate = fromAPIDateTime(isoDate);
    if (!eventDate) return 'upcoming';

    if (eventDate < now && !isCompleted) return 'missed';
    return 'upcoming';
  };

  // Determine which events are completed based on status
  const statusProgress = {
    created: true,
    follow_up: ['interested', 'scheduling', 'scheduled', 'recorded', 'published', 'paid'].includes(placement.current_status || ''),
    meeting: ['scheduling', 'scheduled', 'recorded', 'published', 'paid'].includes(placement.current_status || ''),
    call: ['scheduled', 'recorded', 'published', 'paid'].includes(placement.current_status || ''),
    recording: ['recorded', 'published', 'paid'].includes(placement.current_status || ''),
    live: ['published', 'paid'].includes(placement.current_status || ''),
    paid: placement.current_status === 'paid'
  };

  const events: TimelineEvent[] = [
    {
      date: placement.created_at,
      label: 'Placement Created',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      date: placement.follow_up_date,
      label: 'Follow-up Scheduled',
      icon: <Bell className="w-4 h-4" />,
      status: getEventStatus(placement.follow_up_date, statusProgress.follow_up)
    },
    {
      date: placement.meeting_date,
      label: 'Pre-Interview',
      icon: <Calendar className="w-4 h-4" />,
      status: getEventStatus(placement.meeting_date, statusProgress.meeting)
    },
    {
      date: placement.call_date,
      label: 'Follow-up Call',
      icon: <Phone className="w-4 h-4" />,
      status: getEventStatus(placement.call_date, statusProgress.call)
    },
    {
      date: placement.recording_date,
      label: 'Recording',
      icon: <Mic className="w-4 h-4" />,
      status: getEventStatus(placement.recording_date, statusProgress.recording)
    },
    {
      date: placement.go_live_date,
      label: 'Episode Live',
      icon: <Radio className="w-4 h-4" />,
      status: getEventStatus(placement.go_live_date, statusProgress.live)
    }
  ].filter(event => event.date); // Only show events with dates

  // Add payment milestone if applicable
  if (placement.current_status === 'paid') {
    events.push({
      date: new Date().toISOString(),
      label: 'Payment Received',
      icon: <DollarSign className="w-4 h-4" />,
      status: 'completed'
    });
  }

  // Add rejection if applicable
  if (placement.current_status === 'rejected') {
    events.push({
      date: new Date().toISOString(),
      label: 'Placement Rejected',
      icon: <X className="w-4 h-4" />,
      status: 'completed'
    });
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No timeline events to display. Add dates to track progress.
      </div>
    );
  }

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return {
          line: 'bg-green-500',
          dot: 'bg-green-500 border-green-200',
          icon: 'text-green-700 bg-green-100',
          text: 'text-green-700'
        };
      case 'upcoming':
        return {
          line: 'bg-gray-300',
          dot: 'bg-blue-500 border-blue-200',
          icon: 'text-blue-700 bg-blue-100',
          text: 'text-blue-700'
        };
      case 'missed':
        return {
          line: 'bg-gray-300',
          dot: 'bg-orange-500 border-orange-200',
          icon: 'text-orange-700 bg-orange-100',
          text: 'text-orange-700'
        };
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-6">
        {events.map((event, index) => {
          const colors = getStatusColor(event.status);
          const isLast = index === events.length - 1;
          
          return (
            <div key={index} className="relative flex items-start">
              {/* Vertical line segment */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-full ${
                    event.status === 'completed' ? colors.line : 'bg-gray-200'
                  }`}
                />
              )}
              
              {/* Dot */}
              <div className="relative z-10">
                <div className={`w-8 h-8 rounded-full border-4 ${colors.dot} flex items-center justify-center bg-white`}>
                  {event.status === 'completed' && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="ml-6 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${colors.icon}`}>
                        {event.icon}
                      </div>
                      <h4 className={`font-semibold ${colors.text}`}>
                        {event.label}
                      </h4>
                    </div>
                    {event.date && (
                      <div className="mt-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getDateTimeDescription(event.date)}
                        </p>
                        {event.status === 'upcoming' && isUpcoming(event.date, 7) && (
                          <span className="text-xs text-blue-600 font-medium">(Upcoming)</span>
                        )}
                        {event.status === 'missed' && (
                          <span className="text-xs text-orange-600 font-medium">(Overdue)</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Episode link for live events */}
                  {event.label === 'Episode Live' && placement.episode_link && (
                    <a
                      href={placement.episode_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Listen →
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};