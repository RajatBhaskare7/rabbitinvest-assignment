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
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-elegant">
                  <CalendarIcon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {format(currentDate, "MMMM yyyy")}
                  </h1>
                  <p className="text-muted-foreground">
                    {events.length} events this month
                  </p>
                </div>
              </div>
              
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-muted rounded-lg p-1 mr-4">
                    <Button
                      variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('month')}
                      className={`flex items-center space-x-2 relative ${
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
                      className={`flex items-center space-x-2 relative ${
                        viewMode === 'week' ? 'bg-[#020817] text-[#fff]' : ''
                      }`}
                    >
                      <CalendarRange className="w-4 h-4" />
                      <span>Week</span>
                    </Button>
                  </div>                <Button
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
                  className="ml-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
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
              <CardContent className={`p-6 border ${viewMode === 'week' ? 'overflow-x-auto' : ''}`}>
                {/* Day Headers */}
                <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'gap-4' : 'gap-1'} mb-4`}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className={`p-3 text-center text-sm font-medium text-muted-foreground ${
                      viewMode === 'week' ? 'min-w-[150px]' : ''
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'gap-4' : 'gap-1'}`}>
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentDay = isToday(day);
                    const isOutsideMonth = !isSameMonth(day, currentDate);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`
                          p-2 ${viewMode === 'week' ? 'min-h-[400px] min-w-[150px]' : 'min-h-[120px]'}
                          border border-border rounded-lg cursor-pointer
                          hover:bg-calendar-hover transition-colors
                          ${isCurrentDay ? "bg-calendar-today border-primary" : "bg-card"}
                          ${isOutsideMonth && viewMode === 'month' ? "opacity-50" : ""}
                          relative
                        `}
                        onClick={() => openEventModal(day)}
                      >
                        <div className={`
                          text-sm font-medium mb-2 flex items-center justify-between
                          ${isCurrentDay ? "text-primary font-bold" : "text-foreground"}
                        `}>
                          <span>{format(day, viewMode === 'week' ? 'MMM d' : 'd')}</span>
                          {isCurrentDay && <Badge variant="default" className="text-[10px] px-1">Today</Badge>}
                        </div>
                        
                        <div className={`space-y-1 ${viewMode === 'week' ? 'text-sm' : 'text-xs'}`}>
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`
                                p-2 bg-accent rounded cursor-pointer hover:bg-accent/80
                                ${viewMode === 'week' ? 'mb-2' : ''}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="truncate font-medium">{event.title}</span>
                                </div>
                                {viewMode === 'week' && event.startTime && event.endTime && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {viewMode === 'month' && dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
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