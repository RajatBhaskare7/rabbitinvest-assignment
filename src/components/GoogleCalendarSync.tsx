import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, RefreshCw, Link, Unlink, AlertCircle } from "lucide-react";
import { Event } from "@/types";
import { googleAuthService } from "@/services/googleAuthService";

interface GoogleCalendarSyncProps {
  events: Event[];
  onEventsUpdate: (events: Event[]) => void;
}

const GoogleCalendarSync = ({ events, onEventsUpdate }: GoogleCalendarSyncProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're already connected
    const checkAuth = () => {
      try {
        const isAuth = googleAuthService.isAuthenticated();
        setIsConnected(isAuth);
        if (isAuth) {
          // Sync calendar if we're already authenticated
          syncCalendar();
        }
      } catch (error) {
        console.error('Failed to check Google Calendar auth:', error);
      }
    };

    checkAuth();
  }, []);

  const connectGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      // Initialize Google OAuth flow
          // Use Vite env (import.meta.env) in this project
          const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
          if (!clientId) {
            throw new Error("Google Calendar API client id not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.");
          }

          // Attempt to initialize any client-side Google Calendar helpers (simulated helper)
          const { initializeGoogleCalendar } = await import('@/services/notificationService');
          const ok = await initializeGoogleCalendar();
          if (!ok) throw new Error('Failed to initialize Google Calendar client');
      
      setIsConnected(true);
      toast({
        title: "Connected to Google Calendar",
        description: "Your calendar is now synced with Google Calendar.",
      });
      
      // Perform initial sync
      await syncCalendar();
    } catch (error) {
          console.error('Google Calendar connect error:', error);
          toast({
            title: "Connection Failed",
            description: error?.message || "Failed to connect to Google Calendar. Please try again.",
            variant: "destructive",
          });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = () => {
    setIsConnected(false);
    setLastSyncTime(null);
    localStorage.removeItem("google_calendar_credentials");
    toast({
      title: "Disconnected",
      description: "Google Calendar sync has been disabled.",
    });
  };

  const syncCalendar = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      // Get events from Google Calendar
      const googleEvents = await googleAuthService.getEvents();
      
      // Convert Google Calendar events to our format
      const convertedEvents = googleEvents.map(gEvent => ({
        id: gEvent.id,
        title: gEvent.summary,
        description: gEvent.description || '',
        date: gEvent.start.dateTime.split('T')[0],
        startTime: gEvent.start.dateTime.split('T')[1].substring(0, 5),
        endTime: gEvent.end.dateTime.split('T')[1].substring(0, 5),
        googleEventId: gEvent.id
      }));

      // Update our events state with merged events
      const mergedEvents = [...events.filter(e => !e.googleEventId), ...convertedEvents];
      onEventsUpdate(mergedEvents);

      setLastSyncTime(new Date());
      toast({
        title: "Calendar Synced",
        description: "Your events have been synced with Google Calendar.",
      });
    } catch (error: any) {
      console.error('Sync calendar error:', error);
      toast({
        title: "Sync Failed",
        description: error?.message || "Failed to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Calendar className="w-4 h-4 text-primary-foreground" />
          </div>
          <span>Google Calendar Integration</span>
          {isConnected && (
            <Badge variant="secondary" className="ml-auto">
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Sync your events with Google Calendar for seamless access across all devices.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to automatically sync events and access them from any device.
              </p>
            </div>
            <Button
              onClick={connectGoogleCalendar}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium text-success-foreground">
                  Google Calendar Connected
                </span>
              </div>
              {lastSyncTime && (
                <span className="text-xs text-muted-foreground">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={syncCalendar}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                onClick={disconnectGoogleCalendar}
                variant="outline"
                className="flex-1"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">Sync Status:</p>
              <p>• Events are automatically synced with your Google Calendar</p>
              <p>• Changes made in Google Calendar will be reflected here</p>
              <p>• You can manually sync at any time</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;