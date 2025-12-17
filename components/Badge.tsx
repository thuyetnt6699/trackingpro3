import React from 'react';
import { TrackingStatus } from '../types';

interface BadgeProps {
  status: TrackingStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    info_received: 'bg-blue-50 text-blue-700 border-blue-200',
    in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    delivery_failure: 'bg-red-100 text-red-800 border-red-200',
    exception: 'bg-orange-100 text-orange-800 border-orange-200',
    expired: 'bg-gray-300 text-gray-900 border-gray-400',
  };

  const labels = {
    pending: 'Pending',
    info_received: 'Info Received',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    delivery_failure: 'Failed Attempt',
    exception: 'Exception',
    expired: 'Expired',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};