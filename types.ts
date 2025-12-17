export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // Stores the encrypted/hashed password
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

export interface TrackingEvent {
  date: string;
  status: string;
  detail: string;
  location: string;
}

export interface TrackingInfo {
  id: string; // Internal UUID
  trackingNumber: string;
  carrierCode: string;
  status: TrackingStatus;
  lastUpdate: string;
  description: string;
  addedAt: number;
  events?: TrackingEvent[];
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