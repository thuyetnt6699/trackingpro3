import React from 'react';
import { TrackingInfo } from '../types';
import { Badge } from './Badge';
import { Carrier } from '../types';
import { CHINA_CARRIERS } from '../constants';
import { Trash2, Package, Truck, Clock } from 'lucide-react';

interface TrackingCardProps {
  item: TrackingInfo;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const TrackingCard: React.FC<TrackingCardProps> = ({ item, onDelete, isAdmin }) => {
  const carrierName = CHINA_CARRIERS.find(c => c.code === item.carrierCode)?.name || item.carrierCode;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{item.trackingNumber}</h3>
              <p className="text-sm text-gray-500 font-medium">{carrierName}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span>{item.description}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Updated: {new Date(item.lastUpdate).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3">
          <Badge status={item.status} />
          
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
  );
};