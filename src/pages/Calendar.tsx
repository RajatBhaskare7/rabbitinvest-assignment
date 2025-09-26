import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Bell,
  Settings,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  isSameMonth
} from "date-fns";
import Navbar from "@/components/Navbar";
import EventModal from "@/components/EventModal";
import RemindersPanel from "@/components/RemindersPanel";
import GoogleCalendarSync from "@/components/GoogleCalendarSync";
import { Event } from "@/types";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication and load events
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(user);
    const userEvents = localStorage.getItem(`events_${userData.email}`);
    if (userEvents) {
      setEvents(JSON.parse(userEvents));
    }
  }, [navigate]);

  const saveEvents = (newEvents: Event[]) => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      localStorage.setItem(`events_${userData.email}`, JSON.stringify(newEvents));
      setEvents(newEvents);
    }
  };

  const handleAddEvent = (event: Omit<Event, "id">) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(),
    };
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    toast({
      title: "Event Created",
      description: `"${event.title}" has been added to your calendar.`,
    });
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    const updatedEvents = events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    );
    saveEvents(updatedEvents);
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" has been updated.`,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    const updatedEvents = events.filter(event => event.id !== eventId);
    saveEvents(updatedEvents);
    toast({
      title: "Event Deleted",
      description: `"${eventToDelete?.title}" has been removed.`,
      variant: "destructive",
    });
  };

  const getDaysToDisplay = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const firstDay = startOfWeek(monthStart);
      const lastDay = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: firstDay, end: lastDay });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  };

  const calendarDays = getDaysToDisplay();

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const openEventModal = (date?: Date) => {
    setSelectedDate(date || new Date());
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.date));
    setIsEventModalOpen(true);
  };

  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Calendar Header */}
        <Card className="mb-6 shadow-md border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-elegant">
                  <CalendarIcon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {format(currentDate, "MMMM yyyy")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {events.length} events this month
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="flex items-center bg-muted rounded-lg p-1 mb-2 sm:mb-0 sm:mr-4">
                  <Button
                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 relative ${
                      viewMode === 'month' ? 'bg-[#020817] text-[#fff]' : ''
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Month</span>
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 relative ${
                      viewMode === 'week' ? 'bg-[#020817] text-[#fff]' : ''
                    }`}
                  >
                    <CalendarRange className="w-4 h-4" />
                    <span>Week</span>
                  </Button>
                </div>
                <div className="flex items-center justify-between sm:justify-start space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (viewMode === 'month') {
                        setCurrentDate(subMonths(currentDate, 1));
                      } else {
                        setCurrentDate(subWeeks(currentDate, 1));
                      }
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (viewMode === 'month') {
                        setCurrentDate(addMonths(currentDate, 1));
                      } else {
                        setCurrentDate(addWeeks(currentDate, 1));
                      }
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => openEventModal()}
                    className="ml-0 sm:ml-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Add Event</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            {/* Calendar Grid */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-2 sm:p-6 overflow-x-auto">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4 min-w-[700px] sm:min-w-0">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-4 min-w-[700px] sm:min-w-0">
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentDay = isToday(day);
                    const isOutsideMonth = !isSameMonth(day, currentDate);
                    const displayedEvents = viewMode === 'month' ? dayEvents.slice(0, 2) : dayEvents;
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`
                          relative p-1 sm:p-2
                          ${viewMode === 'week' ? 'h-[300px] sm:h-[400px]' : 'h-[100px] sm:h-[120px]'}
                          border border-border rounded-lg cursor-pointer
                          hover:bg-calendar-hover transition-colors
                          ${isCurrentDay ? "bg-calendar-today border-primary" : "bg-card"}
                          ${isOutsideMonth && viewMode === 'month' ? "opacity-50" : ""}
                        `}
                        onClick={() => openEventModal(day)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs sm:text-sm font-medium
                            ${isCurrentDay ? "text-primary" : "text-foreground"}
                          `}>
                            {format(day, viewMode === 'week' ? 'MMM d' : 'd')}
                          </span>
                          {isCurrentDay && (
                            <Badge variant="default" className="text-[8px] sm:text-[10px] px-1">
                              Today
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
                          {displayedEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`
                                p-1 sm:p-2 bg-accent rounded cursor-pointer hover:bg-accent/80
                                text-[10px] sm:text-xs
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                  <span className="truncate font-medium">{event.title}</span>
                                </div>
                                {viewMode === 'week' && event.startTime && event.endTime && (
                                  <div className="text-[8px] sm:text-xs text-muted-foreground mt-1">
                                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {viewMode === 'month' && dayEvents.length > 2 && (
                            <div className="text-[8px] sm:text-xs text-muted-foreground px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders">
            {userData && <RemindersPanel userEmail={userData.email} />}
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <GoogleCalendarSync 
                events={events} 
                onEventsUpdate={setEvents}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={editingEvent ? handleUpdateEvent : handleAddEvent}
        onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default Calendar;