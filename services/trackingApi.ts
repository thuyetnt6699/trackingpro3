import { TrackingInfo, TrackingEvent } from '../types';
import { TRACKING_MORE_API_KEY } from '../constants';

const BASE_URL = 'https://api.trackingmore.com/v4';

// Helper to map TrackingMore status to our App status
function mapTrackingMoreStatus(tmStatus: string): any {
  switch (tmStatus) {
    case 'transit': return 'in_transit';
    case 'pickup': return 'out_for_delivery';
    case 'delivered': return 'delivered';
    case 'undelivered': return 'delivery_failure';
    case 'exception': return 'exception';
    case 'expired': return 'expired';
    case 'info_received': return 'info_received';
    case 'notfound': return 'pending';
    default: return 'pending';
  }
}

export const TrackingApi = {
  /**
   * Fetches the latest status for a specific tracking number + carrier.
   * Tries Realtime endpoint first, falls back to Create -> Get flow if needed.
   */
  async getStatus(trackingNumber: string, carrierCode: string): Promise<Partial<TrackingInfo>> {
    const cleanTrackingNum = trackingNumber.trim();
    const cleanCarrier = carrierCode.trim();

    const commonHeaders = {
      'Tracking-Api-Key': TRACKING_MORE_API_KEY,
      'Accept': 'application/json'
    };

    const postHeaders = {
      ...commonHeaders,
      'Content-Type': 'application/json'
    };

    // --- Strategy 1: Try Realtime API ---
    try {
      const response = await fetch(`${BASE_URL}/trackings/realtime`, {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({
          tracking_number: cleanTrackingNum,
          carrier_code: cleanCarrier
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.meta?.code === 200 && json.data) {
           const data = json.data;
           
           // Map events if available
           const items = data.items || [];
           const events: TrackingEvent[] = items.map((e: any) => ({
             date: e.checkpoint_date,
             status: e.checkpoint_delivery_status,
             detail: e.tracking_detail,
             location: e.location
           }));

           return {
             status: mapTrackingMoreStatus(data.delivery_status),
             lastUpdate: data.updated_at || new Date().toISOString(),
             description: data.latest_event || `Status: ${data.delivery_status}`,
             events: events
           };
        }
      }
      
      console.warn(`Realtime API attempt failed (Status ${response.status}). Switching to fallback flow.`);
    } catch (e) {
      console.warn("Realtime API network error. Switching to fallback flow.", e);
    }

    // --- Strategy 2: Fallback (Create -> Get) ---

    // Step A: Register the tracking number
    try {
      const createRes = await fetch(`${BASE_URL}/trackings/create`, {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({
          tracking_number: cleanTrackingNum,
          carrier_code: cleanCarrier
        })
      });

      if (!createRes.ok) {
        const createJson = await createRes.json().catch(() => ({}));
        // 4016: Tracking number already exists - this is fine.
        if (createJson.meta?.code !== 4016) {
           console.warn(`Create step warning: ${createJson.meta?.message || createRes.status}`);
        }
      }
    } catch (error: any) {
       console.warn("Create step warning:", error.message);
    }

    // Step B: Get the tracking info
    const getRes = await fetch(`${BASE_URL}/trackings/get?tracking_numbers=${encodeURIComponent(cleanTrackingNum)}`, {
      method: 'GET',
      headers: commonHeaders 
    });

    if (!getRes.ok) {
      let msg = `API Error ${getRes.status}`;
      try {
        const errJson = await getRes.json();
        if (errJson.meta?.message) msg = errJson.meta.message;
      } catch {}
      
      if (msg.includes("Page does not exist")) {
        msg = "Tracking service unavailable (Endpoint Error).";
      }
      throw new Error(msg);
    }

    const getJson = await getRes.json();
    
    // Check if data exists in the array
    if (getJson.data && Array.isArray(getJson.data) && getJson.data.length > 0) {
      // Find the one matching our carrier if possible, or just take the first one
      const data = getJson.data.find((d: any) => d.carrier_code === cleanCarrier) || getJson.data[0];
      
      // Extract events from origin_info (common for China shipments) or destination_info
      const rawEvents = data.origin_info?.trackinfo || data.destination_info?.trackinfo || [];
      
      const events: TrackingEvent[] = rawEvents.map((e: any) => ({
        date: e.checkpoint_date,
        status: e.checkpoint_delivery_status,
        detail: e.tracking_detail,
        location: e.location
      })).sort((a: TrackingEvent, b: TrackingEvent) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        status: mapTrackingMoreStatus(data.delivery_status),
        lastUpdate: data.updated_at || new Date().toISOString(),
        description: data.latest_event || `Status: ${data.delivery_status}`,
        events: events
      };
    }

    throw new Error("Tracking number not found in system.");
  }
};