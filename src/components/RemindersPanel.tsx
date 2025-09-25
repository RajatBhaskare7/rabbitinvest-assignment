import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Check, Clock, Mail, MessageSquare, Trash2 } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { Reminder } from "@/types";
import ReminderModal from "./ReminderModal";

interface RemindersPanelProps {
  userEmail: string;
}

const RemindersPanel = ({ userEmail }: RemindersPanelProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { toast } = useToast();

  // Load reminders from localStorage
  useEffect(() => {
    const userReminders = localStorage.getItem(`reminders_${userEmail}`);
    if (userReminders) {
      setReminders(JSON.parse(userReminders));
    }
  }, [userEmail]);

  // Check for due reminders
  useEffect(() => {
    const checkReminders = () => {
      console.log('Checking reminders at:', new Date().toLocaleTimeString());
      const now = new Date();
      const updatedReminders = reminders.map(reminder => {
        if (!reminder.notificationSent && !reminder.isComplete) {
          const reminderDateTime = parseISO(`${reminder.date}T${reminder.time}`);
          if (isAfter(now, reminderDateTime)) {
            // Send notification
            sendNotification(reminder);
            return { ...reminder, notificationSent: true };
          }
        }
        return reminder;
      });
      
      if (updatedReminders.some((r, i) => r.notificationSent !== reminders[i].notificationSent)) {
        setReminders(updatedReminders);
        saveReminders(updatedReminders);
      }
    };

    // Run an immediate check so reminders due now are handled without waiting
    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  const saveReminders = (newReminders: Reminder[]) => {
    localStorage.setItem(`reminders_${userEmail}`, JSON.stringify(newReminders));
    setReminders(newReminders);
  };

  const sendNotification = async (reminder: Reminder) => {
    // Browser notification (if allowed)
    try {
      console.log('Attempting to send notification for:', reminder.title);
      if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        console.log('Browser notifications are enabled');
        new Notification(reminder.title, {
          body: reminder.description || `Reminder for ${reminder.time}`,
          icon: "/favicon.ico",
        });
        console.log('Browser notification sent successfully');
      } else {
        console.warn('Browser notifications are not enabled. Permission:', Notification.permission);
      }
    } catch (err) {
      console.error('Browser notification failed:', err);
    }

    // Email notification (using EmailJS service if configured)
    if (reminder.emailNotification) {
      try {
        const { sendEmailNotification } = await import('@/services/notificationService');
        const userName = localStorage.getItem('userName') || undefined;
        const sent = await sendEmailNotification(reminder, userEmail, userName);
        if (!sent) console.warn('Email was not sent (service may be unconfigured)');
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }
    }

    // SMS notification (using Twilio service if configured)
    if (reminder.smsNotification && reminder.phoneNumber) {
      try {
        const { sendSMSNotification } = await import('@/services/notificationService');
        const sent = await sendSMSNotification(reminder, reminder.phoneNumber);
        if (!sent) console.warn('SMS was not sent (service may be unconfigured)');
      } catch (error) {
        console.error("Failed to send SMS notification:", error);
      }
    }

    toast({
      title: "Reminder!",
      description: reminder.title,
      duration: 5000,
    });
  };

  const handleAddReminder = (reminder: Omit<Reminder, "id">) => {
    const newReminder = {
      ...reminder,
      id: Date.now().toString(),
    };
    const updatedReminders = [...reminders, newReminder];
    saveReminders(updatedReminders);
    toast({
      title: "Reminder Created",
      description: `"${reminder.title}" has been added.`,
    });
  };

  const handleUpdateReminder = (updatedReminder: Reminder) => {
    const updatedReminders = reminders.map(reminder => 
      reminder.id === updatedReminder.id ? updatedReminder : reminder
    );
    saveReminders(updatedReminders);
    toast({
      title: "Reminder Updated",
      description: `"${updatedReminder.title}" has been updated.`,
    });
  };

  const handleDeleteReminder = (reminderId: string) => {
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    const updatedReminders = reminders.filter(reminder => reminder.id !== reminderId);
    saveReminders(updatedReminders);
    toast({
      title: "Reminder Deleted",
      description: `"${reminderToDelete?.title}" has been removed.`,
      variant: "destructive",
    });
  };

  const toggleReminderComplete = (reminderId: string) => {
    const updatedReminders = reminders.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, isComplete: !reminder.isComplete }
        : reminder
    );
    saveReminders(updatedReminders);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsReminderModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingReminder(null);
    setIsReminderModalOpen(true);
  };

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sortedReminders = reminders.sort((a, b) => {
    // Incomplete reminders first, then by date/time
    if (a.isComplete !== b.isComplete) {
      return a.isComplete ? 1 : -1;
    }
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-accent rounded-lg">
                <Bell className="w-4 h-4 text-accent-foreground" />
              </div>
              <span>Reminders</span>
              <Badge variant="secondary">
                {reminders.filter(r => !r.isComplete).length}
              </Badge>
            </CardTitle>
            <Button onClick={openCreateModal} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {sortedReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No reminders yet</p>
              <Button onClick={openCreateModal} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Reminder
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-lg border transition-all ${
                    reminder.isComplete 
                      ? "bg-muted/50 border-muted" 
                      : "bg-card border-border hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReminderComplete(reminder.id)}
                        className="mt-0.5 p-1 h-6 w-6"
                      >
                        {reminder.isComplete ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-muted-foreground rounded-sm" />
                        )}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${
                          reminder.isComplete ? "line-through text-muted-foreground" : "text-foreground"
                        }`}>
                          {reminder.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(parseISO(reminder.date), "MMM d")} at {reminder.time}
                            </span>
                          </div>
                          {reminder.emailNotification && (
                            <Mail className="w-3 h-3" />
                          )}
                          {reminder.smsNotification && (
                            <MessageSquare className="w-3 h-3" />
                          )}
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {reminder.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(reminder)}
                        className="p-1 h-6 w-6"
                      >
                        <Clock className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="p-1 h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSave={editingReminder ? handleUpdateReminder : handleAddReminder}
        onDelete={editingReminder ? () => handleDeleteReminder(editingReminder.id) : undefined}
        selectedDate={new Date()}
        editingReminder={editingReminder}
      />
    </>
  );
};

export default RemindersPanel;