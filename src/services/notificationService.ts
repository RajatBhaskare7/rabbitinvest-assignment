import emailjs from 'emailjs-com';
import { Reminder } from '@/types';

// Read EmailJS and Twilio configuration from Vite env vars when available
const TWILIO_ACCOUNT_SID = (import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = (import.meta as any).env?.VITE_TWILIO_FROM_NUMBER || '';
const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts/';
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS only when public key is provided
if (EMAILJS_PUBLIC_KEY) {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  } catch (e) {
    // Don't crash the app if EmailJS init fails in development
    // Logging helps debugging when keys are missing or invalid
    // eslint-disable-next-line no-console
    console.warn('EmailJS init failed or not configured:', e);
  }
} else {
  // eslint-disable-next-line no-console
  console.warn('EmailJS public key not configured. Email notifications are disabled.');
}

export const sendEmailNotification = async (reminder: Reminder, userEmail: string, userName?: string): Promise<boolean> => {
  // Declare templateParams outside try-catch so it's accessible in both blocks
  const templateParams = {
    to_email: userEmail,
    from_name: "Sync My Calendar",
    to_name: userName || 'there',
    reminder_title: reminder.title,
    reminder_description: reminder.description || 'No description provided',
    reminder_date: reminder.date,
    reminder_time: reminder.time
  };

  try {
    // Guard: ensure EmailJS is configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS configuration missing; skipping email send.');
      return false;
    }

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Email notification sent successfully', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      params: templateParams
    });
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', {
      error,
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      params: templateParams
    });
    return false;
  }
};

export const sendBrowserNotification = (reminder: Reminder): boolean => {
  if (Notification.permission === 'granted') {
    new Notification(reminder.title, {
      body: reminder.description || `Reminder for ${reminder.time}`,
      icon: '/favicon.ico',
      tag: `reminder-${reminder.id}`,
    });
    return true;
  }
  return false;
};

export const requestNotificationPermission = async (): Promise<string> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return 'denied';
};

// Google Calendar API integration helpers
export const initializeGoogleCalendar = () => {
  // This would initialize the Google Calendar API
  // For now, we'll return a promise that resolves after a delay to simulate API setup
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      console.log('Google Calendar API initialized (simulated)');
      resolve(true);
    }, 1000);
  });
};

export const sendSMSNotification = async (reminder: Reminder, phoneNumber: string): Promise<boolean> => {
  try {
    // Guard: ensure Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      console.warn('Twilio configuration missing; skipping SMS send.');
      return false;
    }

    // Format the message
    const message = `Reminder: ${reminder.title}\n${reminder.description || ''}\nDate: ${reminder.date}\nTime: ${reminder.time}`;

    // Format the data for Twilio API
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', TWILIO_FROM_NUMBER);
    formData.append('Body', message);

    // Create base64 auth string
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Send request to Twilio API
    const response = await fetch(
      `${TWILIO_API_URL}${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send SMS');
    }

    console.log('SMS notification sent successfully', {
      messageId: result.sid,
      to: phoneNumber,
      status: result.status
    });

    return true;
  } catch (error) {
    console.error('Failed to send SMS notification:', {
      error,
      to: phoneNumber
    });
    return false;
  }
};

export const syncWithGoogleCalendar = async (events: any[]): Promise<boolean> => {
  try {
    // Simulate API call to sync events with Google Calendar
    console.log('Syncing events with Google Calendar:', events);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  } catch (error) {
    console.error('Failed to sync with Google Calendar:', error);
    return false;
  }
};