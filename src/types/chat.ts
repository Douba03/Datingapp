import { Message, Match } from './user';

export interface ChatMessage extends Message {
  sender_profile?: {
    first_name: string;
    photos: string[];
  };
}

export interface ChatMatch extends Match {
  other_user: {
    id: string;
    first_name: string;
    photos: string[];
    age: number;
  };
  last_message?: ChatMessage;
  unread_count: number;
}

export interface AIIcebreaker {
  id: string;
  text: string;
  category: string;
  is_used: boolean;
}
