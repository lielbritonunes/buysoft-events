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
  type: "text" | "paragraph" | "select" | "checkbox" | "date" | "country" | "terms";
  required: boolean;
  options?: string[];
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
}
