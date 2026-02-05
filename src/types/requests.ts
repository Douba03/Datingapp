// Connection Request types for Calafdoon
// Replaces the swipe/match system with a request-based contact model

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export type DeclineReason = 
  | 'not_interested'
  | 'different_values'
  | 'location_too_far'
  | 'age_preference'
  | 'already_talking'
  | 'other';

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: RequestStatus;
  message?: string; // Optional intro message
  decline_reason?: DeclineReason;
  decline_note?: string; // Optional custom note when declining
  created_at: string;
  responded_at?: string;
}

export interface RequestCounter {
  user_id: string;
  remaining: number;
  last_exhausted_at?: string;
  next_refill_at?: string;
  created_at: string;
  updated_at: string;
}

// Constants for the request system
export const REQUEST_CONSTANTS = {
  // Maximum requests per day for free users
  MAX_REQUESTS_PER_DAY: 10,
  
  // Hours until requests refill (8 hours)
  REFILL_HOURS: 8,
  
  // Warning threshold
  LOW_REQUESTS_THRESHOLD: 3,
};

// Decline reason labels
export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  not_interested: 'Not interested right now',
  different_values: 'Different values',
  location_too_far: 'Too far away',
  age_preference: 'Age preference',
  already_talking: 'Already talking to someone',
  other: 'Other reason',
};
