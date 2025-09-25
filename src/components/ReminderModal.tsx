import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Bell, Clock, FileText, Trash2, Mail, MessageSquare } from "lucide-react";
import { Reminder } from "@/types";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Reminder | Omit<Reminder, "id">) => void;
  onDelete?: () => void;
  selectedDate: Date | null;
  editingReminder: Reminder | null;
}

const ReminderModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  editingReminder,
}: ReminderModalProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [emailNotification, setEmailNotification] = useState(true);
  const [smsNotification, setSmsNotification] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (editingReminder) {
        setTitle(editingReminder.title);
        setDate(editingReminder.date);
        setTime(editingReminder.time);
        setDescription(editingReminder.description || "");
        setEmailNotification(editingReminder.emailNotification);
        setSmsNotification(editingReminder.smsNotification);
        setPhoneNumber(editingReminder.phoneNumber || "");
      } else {
        setTitle("");
        setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
        setTime("09:00");
        setDescription("");
        setEmailNotification(true);
        setSmsNotification(false);
        setPhoneNumber("");
      }
    }
  }, [isOpen, editingReminder, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const reminderData = {
      title: title.trim(),
      date,
      time,
      description: description.trim(),
      isComplete: false,
      notificationSent: false,
      emailNotification,
      smsNotification,
      phoneNumber: smsNotification ? phoneNumber : undefined,
    };

    try {
      if (editingReminder) {
        onSave({ ...reminderData, id: editingReminder.id });
      } else {
        onSave(reminderData);
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-accent rounded-lg">
              <Bell className="w-4 h-4 text-accent-foreground" />
            </div>
            <span>
              {editingReminder ? "Edit Reminder" : "Create New Reminder"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {editingReminder 
              ? "Update your reminder details below." 
              : "Set up a reminder with optional notifications."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reminder Title *</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter reminder title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Date *</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Time *</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add reminder description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notification Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notification Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={emailNotification}
                  onCheckedChange={(checked) => setEmailNotification(checked as boolean)}
                />
                <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  <span>Email notification</span>
                </Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={smsNotification}
                    onCheckedChange={(checked) => setSmsNotification(checked as boolean)}
                  />
                  <Label htmlFor="sms" className="flex items-center space-x-2 cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS notification</span>
                  </Label>
                </div>
                {smsNotification && (
                  <div className="ml-6 space-y-1">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+919753200029"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Remove all spaces and special characters except +
                        const cleaned = e.target.value.replace(/[^\d+]/g, '');
                        // Ensure only one + at the start
                        const formatted = cleaned.replace(/\+/g, '').replace(/^/, '+');
                        setPhoneNumber(formatted);
                      }}
                      pattern="^\+91\d{10}$"
                      required={smsNotification}
                    />
                    <span className="text-xs text-muted-foreground">
                      Format: +91 followed by 10 digit number (e.g., +919753200029)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingReminder && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Reminder
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (editingReminder ? "Updating..." : "Creating...") 
                : (editingReminder ? "Update Reminder" : "Create Reminder")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderModal;