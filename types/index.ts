// User types
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  location?: {
    country: string;
    state: string;
    city: string;
  };
  isCreator: boolean;
  isVerified: boolean;
  memberSince: string;
  pointsBalance: number;
  followingCreators?: { id: string; name: string }[];
}

// Template types
export interface Template {
  id: string;
  title: string;
  description: string;
  demoImage: string;
  additionalImages?: string[];
  category: TemplateCategory;
  subCategory: TemplateSubCategory;
  tags: string[];
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorBio?: string;
  creatorVerified: boolean;
  hiddenPrompt: string;
  visiblePrompt?: string;
  negativePrompt?: string;
  isFree: boolean;
  pointsCost: number;
  usageCount: number;
  likeCount: number;
  saveCount: number;
  rating: number;
  ratingCount: number;
  ageGroup?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
  status: "approved" | "pending" | "rejected";
}

export type TemplateCategory = "male" | "female" | "unisex";

export type TemplateSubCategory =
  | "wedding"
  | "fashion"
  | "business"
  | "cinematic"
  | "festival"
  | "portrait"
  | "couple"
  | "traditional"
  | "modern"
  | "cartoon"
  | "other";

// Generation types
export interface Generation {
  id: string;
  userId: string;
  templateId?: string;
  templateName?: string;
  prompt: string;
  negativePrompt?: string;
  uploadedImages: string[];
  generatedImage: string;
  quality: QualityLevel;
  aspectRatio: string;
  pointsSpent: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  isFavorite: boolean;
  downloadCount: number;
  shareCount: number;
}

export type QualityLevel = "SD" | "HD" | "UHD" | "2K" | "4K" | "8K";

export interface GenerationSettings {
  quality: QualityLevel;
  aspectRatio: string;
  creativity: number;
  detailLevel: "low" | "medium" | "high";
  facePreservation: number;
}

// Wallet & Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  relatedTemplateId?: string;
  relatedGenerationId?: string;
  paymentMethod?: string;
  createdAt: string;
}

export type TransactionType =
  | "purchase"
  | "generation"
  | "tool_use"
  | "referral_bonus"
  | "daily_login"
  | "ad_watch"
  | "refund"
  | "creator_earning"
  | "withdrawal";

// Points Package types
export interface PointsPackage {
  id: string;
  name: string;
  price: number;
  points: number;
  bonusPoints: number;
  badge?: string;
  benefits: string[];
  isPopular?: boolean;
}

// Creator types
export interface CreatorApplication {
  id: string;
  userId: string;
  username: string;
  socialLinks: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
  };
  demoTemplates: {
    image: string;
    prompt: string;
  }[];
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reapplyDate?: string;
}

export interface CreatorEarnings {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawal: number;
  lastPayoutDate?: string;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: "savings" | "current";
    panNumber: string;
  };
  upiId?: string;
}

export interface WithdrawalRequest {
  id: string;
  creatorId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: "bank" | "upi";
  bankDetails?: CreatorEarnings["bankDetails"];
  upiId?: string;
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  failureReason?: string;
}

// Tool types
export interface AITool {
  id: string;
  name: string;
  icon: string;
  pointsCost: number;
  description: string;
}

// Filter types
export interface TemplateFilters {
  gender: TemplateCategory[];
  type: ("free" | "premium")[];
  category: TemplateSubCategory[];
  state?: string;
  ageGroup: string[];
  sortBy: "trending" | "popular" | "latest" | "top_rated";
}

