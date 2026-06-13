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

export interface UploadedMaterial {
  id: string;
  userId: string;
  businessId: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  size: number;
  createdAt: string;
  analysis?: {
    productShown: string;
    quality: string;
    background: string;
    lighting: string;
    branding: string;
    potential: string;
    recommendations: string[];
  };
}

export interface WeeklyPlanItem {
  week: string; // "Semana 1", "Semana 2", "Semana 3", "Semana 4"
  objective: string;
  contentType: string;
  socialNetwork: string;
  cta: string;
  expectedKPI: string;
}

export interface MarketingStrategy {
  id: string;
  userId: string;
  businessId: string;
  title: string;
  summary: string;
  objectivesSelected: string[];
  socialNetworksSelected: string[];
  materialType: string;
  
  // Paso 5 fields
  diagnostic: string;
  mainGoal: string;
  secondaryGoals: string[];
  suggestedKPIs: string[];
  targetAudience: string;
  recommendedTone: string;
  recommendedContentType: string;
  recommendedFrequency: string;
  socialDistribution: string;

  // Paso 6 fields
  weeklyPlan: WeeklyPlanItem[];
  
  createdAt: string;
}

export interface CalendarPost {
  id: string;
  userId: string;
  businessId: string;
  title: string;
  copy: string;
  cta?: string;
  hashtags?: string[];
  channel: 'Facebook' | 'Instagram' | 'TikTok' | 'Twitter';
  scheduledDate: string; // e.g. "Lunes 15 de Junio" or "2026-06-15"
  scheduledTime?: string; // e.g. "18:00"
  type: string; // Reel, Carrusel, Imagen, Video, etc.
  imageUrlPrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  status: 'Borrador' | 'Pendiente de aprobación' | 'Aprobado' | 'Programado' | 'Publicado' | 'Cancelado' | 'Vencido';
  weekNum: number; // 1, 2, 3, 4
  priority: 'Baja' | 'Media' | 'Alta';
  objective?: string;
  createdAt: string;
}

