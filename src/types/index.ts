export interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  googleEventId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  isComplete: boolean;
  notificationSent: boolean;
  emailNotification: boolean;
  smsNotification: boolean;
  phoneNumber?: string;
}

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}