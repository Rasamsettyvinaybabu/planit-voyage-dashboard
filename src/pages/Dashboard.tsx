
import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TripCard from "@/components/dashboard/TripCard";
import CreateTripButton from "@/components/dashboard/CreateTripButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data
const sampleTrips = [
  {
    id: "trip1",
    name: "Paris Getaway",
    destination: "Paris, France",
    startDate: "2025-06-15",
    endDate: "2025-06-22",
    participants: 4,
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80",
    progress: 75,
    isPast: false,
  },
  {
    id: "trip2",
    name: "Beach Vacation",
    destination: "Cancun, Mexico",
    startDate: "2025-08-10",
    endDate: "2025-08-17",
    participants: 6,
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&auto=format&fit=crop&q=80",
    progress: 40,
    isPast: false,
  },
  {
    id: "trip3",
    name: "Mountain Retreat",
    destination: "Banff, Canada",
    startDate: "2025-07-02",
    endDate: "2025-07-09",
    participants: 3,
    image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800&auto=format&fit=crop&q=80",
    progress: 25,
    isPast: false,
  },
  {
    id: "trip4",
    name: "Winter Holiday",
    destination: "Aspen, Colorado",
    startDate: "2024-12-20",
    endDate: "2024-12-27",
    participants: 5,
    image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&auto=format&fit=crop&q=80",
    progress: 100,
    isPast: true,
  },
  {
    id: "trip5",
    name: "Safari Adventure",
    destination: "Nairobi, Kenya",
    startDate: "2024-11-05",
    endDate: "2024-11-15",
    participants: 4,
    image: "https://images.unsplash.com/photo-1518877593221-1f28583780b4?w=800&auto=format&fit=crop&q=80",
    progress: 100,
    isPast: true,
  },
];

const activityItems = [
  {
    id: 1,
    user: "Sarah",
    action: "added a new hotel option to",
    trip: "Paris Getaway",
    time: "2 hours ago",
  },
  {
    id: 2,
    user: "Mike",
    action: "commented on an activity in",
    trip: "Beach Vacation",
    time: "5 hours ago",
  },
  {
    id: 3,
    user: "Lisa",
    action: "joined",
    trip: "Mountain Retreat",
    time: "Yesterday",
  },
  {
    id: 4,
    user: "John",
    action: "uploaded photos to",
    trip: "Winter Holiday",
    time: "2 days ago",
  },
];

export default function Dashboard() {
  const [greeting, setGreeting] = useState("");
  const [upcomingTrips, setUpcomingTrips] = useState(sampleTrips.filter(trip => !trip.isPast));
  const [pastTrips, setPastTrips] = useState(sampleTrips.filter(trip => trip.isPast));
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get time of day for greeting
    const hour = new Date().getHours();
    let greetMsg = "";
    
    if (hour < 12) greetMsg = "Good morning";
    else if (hour < 18) greetMsg = "Good afternoon";
    else greetMsg = "Good evening";
    
    setGreeting(`${greetMsg}, John!`);
    
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
  const [counters, setCounters] = useState({
    upcoming: 0,
    past: 0,
    invitations: 3,
  });
  
  // Simulate counter animation
  useEffect(() => {
    if (!loading) {
      const upcomingInterval = setInterval(() => {
        setCounters(prev => {
          if (prev.upcoming < upcomingTrips.length) {
            return { ...prev, upcoming: prev.upcoming + 1 };
          }
          clearInterval(upcomingInterval);
          return prev;
        });
      }, 200);
      
      const pastInterval = setInterval(() => {
        setCounters(prev => {
          if (prev.past < pastTrips.length) {
            return { ...prev, past: prev.past + 1 };
          }
          clearInterval(pastInterval);
          return prev;
        });
      }, 200);
      
      return () => {
        clearInterval(upcomingInterval);
        clearInterval(pastInterval);
      };
    }
  }, [loading, upcomingTrips.length, pastTrips.length]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      
      <main className="flex-1 py-8">
        <div className="container px-4 sm:px-6">
          {/* Greeting & Stats */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-planit-navy animate-fade-in">{greeting}</h1>
              <p className="text-gray-600 mt-1 animate-fade-in" style={{animationDelay: '0.1s'}}>
                {loading ? (
                  <span className="inline-block w-60 h-5 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  `Here's what's happening with your trips`
                )}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 min-w-[120px] animate-fade-in" style={{animationDelay: '0.2s'}}>
                <p className="text-sm text-gray-500">Upcoming Trips</p>
                <p className="text-2xl font-bold text-planit-teal mt-1">{loading ? '...' : counters.upcoming}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 min-w-[120px] animate-fade-in" style={{animationDelay: '0.3s'}}>
                <p className="text-sm text-gray-500">Past Trips</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{loading ? '...' : counters.past}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 min-w-[120px] animate-fade-in" style={{animationDelay: '0.4s'}}>
                <p className="text-sm text-gray-500">Invitations</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-planit-coral">{loading ? '...' : counters.invitations}</p>
                  {!loading && counters.invitations > 0 && (
                    <span className="text-xs bg-planit-coral/10 text-planit-coral px-2 py-0.5 rounded-full font-medium">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Trips Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Trips */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-planit-navy">Your Trips</h2>
                <CreateTripButton />
              </div>
              
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="mt-6">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="card-trip animate-pulse">
                          <div className="h-44 bg-gray-200 rounded-lg mb-3"></div>
                          <div className="space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingTrips.map((trip, index) => (
                        <div key={trip.id} className="animate-fade-in" style={{animationDelay: `${0.1 * index}s`}}>
                          <TripCard trip={trip} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-100 animate-fade-in">
                      <div className="mx-auto w-24 h-24 bg-planit-teal/10 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-planit-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-planit-navy">No upcoming trips</h3>
                      <p className="text-gray-600 mt-2 max-w-sm mx-auto">
                        Time to start planning your next adventure!
                      </p>
                      <div className="mt-6">
                        <CreateTripButton />
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="past" className="mt-6">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2].map(i => (
                        <div key={i} className="card-trip animate-pulse">
                          <div className="h-44 bg-gray-200 rounded-lg mb-3"></div>
                          <div className="space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pastTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pastTrips.map((trip, index) => (
                        <div key={trip.id} className="animate-fade-in" style={{animationDelay: `${0.1 * index}s`}}>
                          <TripCard trip={trip} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-100 animate-fade-in">
                      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-planit-navy">No past trips</h3>
                      <p className="text-gray-600 mt-2 max-w-sm mx-auto">
                        Your trip history will appear here after your first trip.
                      </p>
                      <div className="mt-6">
                        <CreateTripButton />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Activity */}
            <div className="lg:w-80 xl:w-96">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-lg text-planit-navy mb-4">Recent Activity</h3>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityItems.length > 0 ? (
                  <div className="space-y-5">
                    {activityItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3 animate-fade-in" style={{animationDelay: `${0.1 * index}s`}}>
                        <div className="h-8 w-8 rounded-full bg-planit-coral/10 flex items-center justify-center text-planit-coral">
                          <span className="font-medium text-sm">{item.user.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{item.user}</span>{" "}
                            {item.action}{" "}
                            <span className="font-medium text-planit-teal hover:underline cursor-pointer">
                              {item.trip}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="ghost" size="sm" className="text-planit-teal w-full text-sm">
                      View all activity
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      No recent activity to show
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 bg-planit-teal/10 rounded-lg p-5">
                <h3 className="font-semibold text-lg text-planit-navy mb-2">Travel Tips</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Complete your trip planning by adding these essential details:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-planit-teal" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Add accommodation details
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-planit-teal" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Create a daily itinerary
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-planit-teal" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Invite travel companions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
