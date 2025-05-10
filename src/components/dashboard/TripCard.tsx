
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type TripCardProps = {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    participants: number;
    image?: string;
    progress: number;
    isPast: boolean;
  };
};

export default function TripCard({ trip }: TripCardProps) {
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <div className={`card-trip group transition-all hover:translate-y-[-4px] ${trip.isPast ? 'opacity-75' : ''}`}>
        {/* Image Section */}
        <div className="h-44 rounded-lg relative overflow-hidden mb-3">
          {trip.image ? (
            <img
              src={trip.image}
              alt={trip.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className={`h-full w-full ${trip.isPast ? 'bg-gray-300' : 'bg-planit-teal/20'} flex items-center justify-center`}>
              <MapPin className={`h-12 w-12 ${trip.isPast ? 'text-gray-400' : 'text-planit-teal'}`} />
            </div>
          )}
          
          {/* Status badge */}
          <div className={`absolute top-3 right-3 py-1 px-3 rounded-full text-xs font-medium ${
            trip.isPast 
              ? 'bg-gray-200 text-gray-700' 
              : 'bg-planit-yellow text-planit-navy'
          }`}>
            {trip.isPast ? "Past" : "Upcoming"}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-planit-navy">{trip.name}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {trip.destination}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>{trip.participants}</span>
            </div>
          </div>
          
          {/* Progress Section */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Planning progress</span>
              <span className="font-medium">{trip.progress}%</span>
            </div>
            <Progress value={trip.progress} className="h-1.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
