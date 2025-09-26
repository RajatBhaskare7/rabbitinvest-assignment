// Types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (config?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

import { Event } from '@/types';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

class GoogleAuthService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  async init() {
    if (this.tokenClient) return;

    // Load the Google Identity Services script
    await this.loadGoogleIdentityScript();

    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Calendar API client ID not configured');
    }

    // Initialize token client with development-friendly settings
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: this.SCOPES.join(' '),
      callback: (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
        this.accessToken = response.access_token;
        this.tokenExpiry = Date.now() + (response.expires_in * 1000);
      },
      error_callback: (error: any) => {
        console.error('Google OAuth error:', error);
        throw new Error(error.type || 'Failed to authenticate');
      },
      prompt: 'consent' // Always show consent screen during development
    });
  }

  private async loadGoogleIdentityScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async requestAccess() {
    if (!this.tokenClient) {
      await this.init();
    }

    return new Promise<void>((resolve, reject) => {
      try {
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          this.tokenExpiry = Date.now() + (response.expires_in * 1000);
          resolve();
        };

        // Request a new access token
        this.tokenClient.requestAccessToken({
          prompt: 'consent' // Always show consent screen during development
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokenExpiry || Date.now() >= this.tokenExpiry - 60000) { // Refresh if token expires in less than 1 minute
      await this.requestAccess();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  async getEvents(): Promise<GoogleEvent[]> {
    try {
      await this.refreshTokenIfNeeded();

      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?' + new URLSearchParams({
          timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          timeMax: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.status === 'UNAUTHENTICATED' || error.error?.code === 401) {
          this.accessToken = null;
          this.tokenExpiry = null;
          throw new Error('authentication expired');
        }
        throw new Error(error.error?.message || 'Failed to fetch events');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  async addEvent(event: Event): Promise<GoogleEvent> {
    try {
      await this.refreshTokenIfNeeded();

      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: event.title,
            description: event.description,
            start: {
              dateTime: `${event.date}T${event.startTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: `${event.date}T${event.endTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.error?.status === 'UNAUTHENTICATED' || error.error?.code === 401) {
          this.accessToken = null;
          this.tokenExpiry = null;
          throw new Error('authentication expired');
        }
        throw new Error(error.error?.message || 'Failed to add event');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error adding Google Calendar event:', error);
      throw error;
    }
  }

  logout() {
    this.accessToken = null;
    this.tokenExpiry = null;
    // Clear any Google sign-in state
    if ((window as any).google?.accounts?.oauth2?.revoke) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Google OAuth token revoked');
      });
    }
  }
}

export const googleAuthService = new GoogleAuthService();