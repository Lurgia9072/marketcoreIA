export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
  plan: 'free' | 'basic' | 'profesional' | 'premium';
  trial: boolean;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  name: string;
  niche: string;
  description: string;
  targetAudience?: string;
  socialHandles?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
  };
  createdAt: string;
}

export interface MarketingStrategy {
  id: string;
  userId: string;
  businessId: string;
  title: string;
  summary: string;
  posts: CalendarPost[];
  createdAt: string;
}

export interface CalendarPost {
  id: string;
  userId: string;
  businessId: string;
  title: string;
  copy: string;
  channel: 'Instagram' | 'TikTok' | 'Facebook' | 'Twitter';
  scheduledDate: string; // e.g. "Día 1", "Día 5"
  type: string; // Reel, Carrusel, Video, etc.
  imageUrlPrompt?: string;
  imageUrl?: string;
  status: 'draft' | 'scheduled' | 'published';
  createdAt: string;
}
