export type UserStatus = 'active' | 'suspended' | 'deleted';
export type GenderType = 'man' | 'woman' | 'non_binary' | 'prefer_not_to_say' | 'custom';
export type RelationshipIntent = 'serious_relationship' | 'open_to_long_term' | 'not_sure' | 'casual';
export type SwipeAction = 'like' | 'pass' | 'superlike';
export type MatchStatus = 'active' | 'unmatched' | 'blocked';
export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type NotificationType = 'match_created' | 'message_created' | 'swipe_refilled' | 'weekly_insights';

export interface User {
  id: string;
  auth_provider: string;
  email: string;
  phone?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  onboarding_completed: boolean;
  is_premium: boolean;
  premium_until?: string;
  grace_period_until?: string;
}

export interface Profile {
  user_id: string;
  first_name: string;
  date_of_birth: string;
  gender: GenderType;
  custom_gender?: string;
  sexual_orientation: string[];
  bio?: string;
  photos: string[];
  primary_photo_idx: number;
  location?: {
    lat: number;
    lng: number;
  };
  city?: string;
  country?: string;
  interests?: string[];
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  verification_photo?: string;
  age: number;
  preferences?: Preferences;
}

export interface Preferences {
  user_id: string;
  seeking_genders: GenderType[];
  age_min: number;
  age_max: number;
  max_distance_km: number;
  relationship_intent: RelationshipIntent;
  lifestyle: Record<string, any>;
  values: string[];
  deal_breakers: string[];
  interests: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  focus_session_duration: number;
  daily_goal?: string;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  swiper_user_id: string;
  target_user_id: string;
  action: SwipeAction;
  created_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  created_at: string;
  last_message_at?: string;
  ai_icebreakers: string[];
  icebreakers_generated_at?: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  media: string[];
  message_type: string;
  created_at: string;
  read_by_a: boolean;
  read_by_b: boolean;
  read_at_a?: string;
  read_at_b?: string;
  is_ai_generated: boolean;
}

export interface SwipeCounter {
  user_id: string;
  remaining: number;
  last_exhausted_at?: string;
  next_refill_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  swipes_count: number;
  matches_count: number;
  started_at: string;
  ended_at?: string;
  goal?: string;
  notes?: string;
}