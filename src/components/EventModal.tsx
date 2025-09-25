import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Clock, FileText, Trash2 } from "lucide-react";
import { Event } from "@/types";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event | Omit<Event, "id">) => void;
  onDelete?: () => void;
  selectedDate: Date | null;
  editingEvent: Event | null;
}

const EventModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  editingEvent,
}: EventModalProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when modal opens/closes or editing event changes
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setDate(editingEvent.date);
        setStartTime(editingEvent.startTime);
        setEndTime(editingEvent.endTime);
        setDescription(editingEvent.description);
      } else {
        setTitle("");
        setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
        setStartTime("09:00");
        setEndTime("10:00");
        setDescription("");
      }
    }
  }, [isOpen, editingEvent, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const eventData = {
      title: title.trim(),
      date,
      startTime,
      endTime,
      description: description.trim(),
    };

    try {
      if (editingEvent) {
        onSave({ ...eventData, id: editingEvent.id });
      } else {
        onSave(eventData);
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
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
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {editingEvent 
              ? "Update your event details below." 
              : "Fill in the details for your new event."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Event Title *</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
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

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Start Time *</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>End Time *</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add event description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingEvent && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (editingEvent ? "Updating..." : "Creating...") 
                : (editingEvent ? "Update Event" : "Create Event")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;