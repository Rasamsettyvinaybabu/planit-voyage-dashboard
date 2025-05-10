import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateTripButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
      
      // Show success message
      toast({
        title: "Trip created!",
        description: `"${formData.name}" has been created successfully.`,
      });
      
      // Trigger confetti animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Reset form
      setFormData({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
      });
    }, 1500);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="btn-accent flex gap-2">
            <Plus className="h-5 w-5" />
            <span>Create New Trip</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create a new trip</DialogTitle>
              <DialogDescription>
                Start planning your next adventure. You can invite friends later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Trip name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Summer vacation"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  name="destination"
                  placeholder="Paris, France"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-planit-teal hover:bg-planit-teal/90"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                backgroundColor: [
                  "#1A9A8B",
                  "#FF7D63",
                  "#FFD166",
                  "#203752",
                ][Math.floor(Math.random() * 4)],
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${Math.random() * 1 + 1.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
