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

class GoogleAuthService {
  private tokenClient: any = null;
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;

    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env');
    }

    // Wait for the Google Identity Services script to load
    if (!window.google?.accounts?.oauth2) {
      console.warn('Google Identity Services not loaded yet. Retrying in 1s...');
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.init()), 1000);
      });
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      callback: (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
        // Store the access token securely (you might want to use your own storage method)
        localStorage.setItem('google_access_token', response.access_token);
        console.log('Google OAuth successful');
      },
    });

    this.isInitialized = true;
  }

  async requestAccess() {
    if (!this.isInitialized) await this.init();
    if (!this.tokenClient) throw new Error('Token client not initialized');
    
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  async getEvents(timeMin?: Date, timeMax?: Date): Promise<any[]> {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) throw new Error('Not authenticated with Google Calendar');

    const params = new URLSearchParams({
      timeMin: (timeMin || new Date()).toISOString(),
      timeMax: (timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    return data.items || [];
  }

  async addEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }) {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) throw new Error('Not authenticated with Google Calendar');

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add event to Google Calendar');
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_access_token');
  }

  logout() {
    localStorage.removeItem('google_access_token');
  }
}

export const googleAuthService = new GoogleAuthService();