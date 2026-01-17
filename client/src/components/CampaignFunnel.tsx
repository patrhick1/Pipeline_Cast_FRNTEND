import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Search, UserCheck, Send, MessageSquare, Award } from 'lucide-react';

interface CampaignFunnelProps {
  stats: {
    discovered: number;
    vetted: number;
    pitched: number;
    responses: number;
    bookings: number;
  };
}

const funnelStages = [
  { key: 'discovered', label: 'Podcasts Discovered', icon: Search, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { key: 'vetted', label: 'Approved Matches', icon: UserCheck, color: 'text-teal-500', bgColor: 'bg-teal-50' },
  { key: 'pitched', label: 'Pitches Sent', icon: Send, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { key: 'responses', label: 'Replies Received', icon: MessageSquare, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { key: 'bookings', label: 'Placements Secured', icon: Award, color: 'text-green-500', bgColor: 'bg-green-50' },
];

export const CampaignFunnel = ({ stats }: CampaignFunnelProps) => {
  return (
    <div className="w-full">
      <div className="relative h-full flex items-end">
        {funnelStages.map((stage, index) => {
          const value = stats[stage.key as keyof typeof stats] || 0;
          const prevValue = index > 0 ? stats[funnelStages[index - 1].key as keyof typeof stats] || 0 : value;
          const percentage = prevValue > 0 ? (value / prevValue) * 100 : 100;

          // Make the first bar always 100% height for visual stability
          const barHeight = index === 0 ? 100 : percentage;

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center group relative pt-10">
              {/* Value */}
              <div className="text-xl font-bold text-gray-800 z-10">{value}</div>
              {/* Bar */}
              <div
                className={`w-4/5 rounded-t-md ${stage.bgColor} transition-all duration-500 ease-in-out`}
                style={{ height: `${barHeight}%` }}
              >
                <div className="h-full w-full opacity-50"></div>
              </div>
              {/* Icon and Label */}
              <div className="mt-2 text-center">
                <div className="flex justify-center items-center h-8 w-8 rounded-full bg-gray-100 mb-1">
                  <stage.icon className={`h-5 w-5 ${stage.color}`} />
                </div>
                <p className="text-xs text-gray-600 font-medium">{stage.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 