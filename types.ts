export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Carrier {
  name: string;
  code: string;
}

export type TrackingStatus = 
  | 'pending' 
  | 'info_received' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'delivery_failure' 
  | 'exception' 
  | 'expired';

export interface TrackingInfo {
  id: string; // Internal UUID
  trackingNumber: string;
  carrierCode: string;
  status: TrackingStatus;
  lastUpdate: string;
  description: string;
  addedAt: number;
  events?: any[];
}

// TrackingMore API Response Shape (Simplified)
export interface TrackingMoreResponse {
  meta: {
    code: number;
    message: string;
  };
  data: {
    delivery_status: TrackingStatus;
    updated_at: string;
    latest_event: string;
    // ... other fields
  };
}