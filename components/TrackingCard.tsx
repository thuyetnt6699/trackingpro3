import React, { useState } from 'react';
import { TrackingInfo } from '../types';
import { Badge } from './Badge';
import { CHINA_CARRIERS } from '../constants';
import { Trash2, Package, Truck, Clock, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

interface TrackingCardProps {
  item: TrackingInfo;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const TrackingCard: React.FC<TrackingCardProps> = ({ item, onDelete, isAdmin }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const carrierName = CHINA_CARRIERS.find(c => c.code === item.carrierCode)?.name || item.carrierCode;

  // Function to format date like "2025-12-10"
  const getDateString = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  // Function to format time like "09:33:37"
  const getTimeString = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-GB', { hour12: false });
    } catch {
      return '';
    }
  };

  // Group events by date if necessary, but for this specific UI, we render line by line
  // Use a helper to determine if we should show the date on the left (only show if different from prev)
  const events = item.events || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md overflow-hidden">
      {/* Top Summary Section (Always Visible) */}
      <div 
        className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{item.trackingNumber}</h3>
                <p className="text-sm text-gray-500 font-medium">{carrierName}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <Truck className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span className="font-medium line-clamp-2">{item.description}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 pl-1">
                <Clock className="w-3 h-3" />
                <span>Updated: {new Date(item.lastUpdate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 min-w-[120px]">
            <Badge status={item.status} />
            
            <div className="flex items-center gap-2 mt-1 sm:mt-4" onClick={(e) => e.stopPropagation()}>
               {/* Expand Button */}
               <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {isExpanded ? 'Hide Details' : 'View Details'}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isAdmin && (
                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete tracking"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details (Timeline) */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-white p-4 sm:p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
            Shipment Progress
          </h4>
          
          {events.length > 0 ? (
            <div className="space-y-0">
              {events.map((event, index) => {
                const isFirst = index === 0;
                const isLast = index === events.length - 1;
                const dateStr = getDateString(event.date);
                const timeStr = getTimeString(event.date);
                
                // Check if we need to show the date label (if it's the first item or different from previous)
                const prevDate = index > 0 ? getDateString(events[index - 1].date) : null;
                const showDate = dateStr !== prevDate;

                return (
                  <div key={index} className="flex">
                    {/* Left Column: Date */}
                    <div className="w-24 sm:w-32 text-right pr-4 pt-1 shrink-0">
                      {showDate && (
                        <span className="text-sm font-bold text-gray-500 block">
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Middle Column: Timeline Line & Dot */}
                    <div className="relative flex flex-col items-center w-8 shrink-0">
                       {/* Line connecting dots */}
                       {!isLast && (
                         <div className="absolute top-4 bottom-[-24px] w-0.5 bg-gray-200" />
                       )}
                       
                       {/* Icon/Dot */}
                       <div className={`relative z-10 w-4 h-4 rounded-full mt-1.5 border-2 ${isFirst ? 'bg-blue-600 border-blue-100 ring-4 ring-blue-50' : 'bg-gray-300 border-white'}`}>
                          {isFirst && <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full" />}
                       </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="flex-1 pb-8 pl-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs text-gray-400 font-mono shrink-0 w-14">
                          {timeStr}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm leading-relaxed ${isFirst ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                            {event.detail}
                          </p>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No detailed tracking events available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};