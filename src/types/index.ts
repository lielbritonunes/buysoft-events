export type EventStatus = "draft" | "published" | "live" | "ended";

export interface Speaker {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  bio: string;
  avatarUrl?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "paragraph" | "select" | "checkbox" | "date" | "country" | "terms" | "hidden";
  required: boolean;
  options?: string[];
  optionsJson?: string;
  placeholder?: string;
}

export interface WebinarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO or formatted
  endDate: string;
  timezone: string;
  status: EventStatus;
  registeredCount: number;
  maxAttendees?: number;
  bannerUrl?: string;
  speakers: Speaker[];
  formFields: FormField[];
  settings: {
    chatEnabled: boolean;
    qaEnabled: boolean;
    pollsEnabled: boolean;
    attendeeListVisible: boolean;
    autoRecord: boolean;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatarInitials: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  mfaEnabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  about: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  planName: string;
  members: OrganizationMember[];
  customSmtpEnabled?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpSendersJson?: string | null;
  defaultSender?: string | null;
  youtubeIntegration?: {
    channelId?: string | null;
    channelTitle?: string | null;
    channelThumbnail?: string | null;
    updatedAt?: Date | string;
  } | null;
}
