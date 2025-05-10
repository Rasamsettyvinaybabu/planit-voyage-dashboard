
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const tripTemplates = [
  {
    title: "Weekend Getaway",
    description: "A short trip perfect for nearby destinations.",
    icon: <span className="text-3xl">🏙️</span>,
    duration: "2-3 days"
  },
  {
    title: "City Break",
    description: "Explore a new city and its attractions.",
    icon: <span className="text-3xl">🏛️</span>,
    duration: "3-5 days"
  },
  {
    title: "Beach Vacation",
    description: "Relax by the ocean with sand and sun.",
    icon: <span className="text-3xl">🏖️</span>,
    duration: "5-7 days"
  },
  {
    title: "Road Trip",
    description: "Travel by car with multiple stops along the way.",
    icon: <span className="text-3xl">🚗</span>,
    duration: "3-10 days"
  },
  {
    title: "Family Holiday",
    description: "Activities and accommodation suitable for all ages.",
    icon: <span className="text-3xl">👨‍👩‍👧‍👦</span>,
    duration: "7-14 days"
  },
  {
    title: "Adventure Trip",
    description: "For outdoor activities and exploring nature.",
    icon: <span className="text-3xl">🏔️</span>,
    duration: "5-10 days"
  },
  {
    title: "Start from Scratch",
    description: "Create your own custom trip completely from scratch.",
    icon: <span className="text-3xl">✨</span>,
    duration: "Any"
  }
];

const CreateTripButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleTemplateClick = (index: number) => {
    if (index === tripTemplates.length - 1) {
      // If "Start from Scratch" was selected, go directly to create page
      window.location.href = "/trips/create";
      return;
    }
    
    setSelectedTemplate(index);
    setIsAnimating(true);
    
    // Simulate loading for a better UX
    setTimeout(() => {
      window.location.href = "/trips/create";
    }, 1000);
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Trip</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-planit-navy">Create a New Trip</DialogTitle>
          <DialogDescription>
            Choose a template to help you get started or create from scratch.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {tripTemplates.map((template, i) => (
            <Card 
              key={i}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === i ? 'ring-2 ring-planit-teal' : 'hover:border-planit-teal/50'
              }`}
              onClick={() => handleTemplateClick(i)}
            >
              <CardHeader className={`pb-2 ${i === tripTemplates.length - 1 ? 'bg-gradient-to-br from-planit-teal/10 to-planit-coral/10' : ''}`}>
                <div className="flex justify-center">
                  {template.icon}
                </div>
              </CardHeader>
              <CardContent className="pt-3 pb-2 text-center">
                <CardTitle className="text-md">{template.title}</CardTitle>
                <CardDescription className="text-xs mt-1.5 h-12 overflow-hidden">
                  {template.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-0 text-center justify-center">
                <span className="text-xs text-gray-500">
                  {template.duration}
                </span>
              </CardFooter>
              
              {selectedTemplate === i && isAnimating && (
                <div className="absolute inset-0 bg-planit-teal/5 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-planit-teal"></div>
                </div>
              )}
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Link to="/trips/create" className="ml-3">
            <Button>Create from Scratch</Button>
          </Link>
        </div>
        
        {/* Confetti effect */}
        <div className="absolute -z-10">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ['#9b87f5', '#f97316', '#0ea5e9'][Math.floor(Math.random() * 3)],
                opacity: Math.random(),
                animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTripButton;
