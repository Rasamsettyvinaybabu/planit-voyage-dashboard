import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { differenceInDays, format, parseISO } from "date-fns";
import { 
  Calendar, Share, Download, Edit, MapPin, 
  Users, Clock, DollarSign, CheckCircle2, Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define Trip Type
type Trip = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  currency: string;
  description: string | null;
  privacy: "public" | "private";
  cover_image_url: string | null;
  invite_code: string;
  created_at: string;
};

// Update Participant type to have optional user property
type Participant = {
  id: string;
  user_id: string;
  is_owner: boolean;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
};

type Activity = {
  id: string;
  title: string;
  date: string | null;
  category: "adventure" | "food" | "sightseeing" | "other";
  status: "confirmed" | "pending" | "voting";
  cost: number | null;
};

type TripInvitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

const TripDashboard = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [currentTab, setCurrentTab] = useState("itinerary");
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUserIsOwner, setCurrentUserIsOwner] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;

      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login', { state: { redirect: `/trips/${tripId}` } });
          return;
        }

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (tripError) {
          console.error("Error fetching trip:", tripError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "This trip doesn't exist or you don't have permission to view it.",
          });
          navigate('/dashboard');
          return;
        }

        setTrip(tripData as Trip);

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            is_owner
          `)
          .eq('trip_id', tripId);

        if (!participantsError && participantsData) {
          // Fetch user profile data separately
          const userIds = participantsData.map(p => p.user_id);
          
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', userIds);
            
          // Create participants with user data
          if (usersData) {
            const userMap = new Map(usersData.map(user => [user.id, user]));
            
            const enhancedParticipants = participantsData.map(p => ({
              ...p,
              user: userMap.get(p.user_id) || null
            }));
            
            setParticipants(enhancedParticipants as Participant[]);
            
            // Check if current user is owner
            const user = await supabase.auth.getUser();
            if (user.data.user) {
              const isOwner = enhancedParticipants.some(
                (p) => p.user_id === user.data.user!.id && p.is_owner
              );
              setCurrentUserIsOwner(isOwner);
            }
          } else {
            // If we can't fetch user data, set participants with null user data
            setParticipants(participantsData.map(p => ({ ...p, user: null })) as Participant[]);
          }
        }

        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id, title, date, category, status, cost')
          .eq('trip_id', tripId)
          .order('date', { ascending: true });

        if (!activitiesError) {
          setActivities(activitiesData as Activity[]);
        }

        // Fetch invitations if user is owner
        if (currentUserIsOwner) {
          const { data: invitationsData, error: invitationsError } = await supabase
            .from('trip_invitations')
            .select('id, email, status, created_at')
            .eq('trip_id', tripId);

          if (!invitationsError) {
            setInvitations(invitationsData as TripInvitation[]);
          }
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load trip data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, navigate, toast]);

  // Set up real-time listeners
  useEffect(() => {
    if (!tripId) return;
    
    // Listen for participant changes
    const participantsSubscription = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
          filter: `trip_id=eq.${tripId}`,
        },
        async () => {
          // Refetch participants data
          const { data: participantsData } = await supabase
            .from('trip_participants')
            .select(`
              id,
              user_id,
              is_owner
            `)
            .eq('trip_id', tripId);
            
          if (participantsData) {
            // Fetch user profile data separately
            const userIds = participantsData.map(p => p.user_id);
            
            const { data: usersData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, email')
              .in('id', userIds);
              
            // Create participants with user data
            if (usersData) {
              const userMap = new Map(usersData.map(user => [user.id, user]));
              
              const enhancedParticipants = participantsData.map(p => ({
                ...p,
                user: userMap.get(p.user_id) || null
              }));
              
              setParticipants(enhancedParticipants as Participant[]);
            } else {
              // If we can't fetch user data, set participants with null user data
              setParticipants(participantsData.map(p => ({ ...p, user: null })) as Participant[]);
            }
          }
        }
      )
      .subscribe();

    // Listen for activity changes
    const activitiesSubscription = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          // Refetch activities data
          supabase
            .from('activities')
            .select('id, title, date, category, status, cost')
            .eq('trip_id', tripId)
            .order('date', { ascending: true })
            .then(({ data }) => {
              if (data) setActivities(data as Activity[]);
            });
        }
      )
      .subscribe();

    // Listen for invitation changes if user is owner
    const invitationsSubscription = currentUserIsOwner
      ? supabase
          .channel('invitations-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'trip_invitations',
              filter: `trip_id=eq.${tripId}`,
            },
            () => {
              // Refetch invitations data
              supabase
                .from('trip_invitations')
                .select('id, email, status, created_at')
                .eq('trip_id', tripId)
                .then(({ data }) => {
                  if (data) setInvitations(data as TripInvitation[]);
                });
            }
          )
          .subscribe()
      : null;

    // Cleanup subscriptions on unmount
    return () => {
      participantsSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
      if (invitationsSubscription) invitationsSubscription.unsubscribe();
    };
  }, [tripId, currentUserIsOwner]);

  const copyInviteCode = () => {
    if (!trip) return;
    
    navigator.clipboard.writeText(trip.invite_code);
    setCopySuccess(true);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard.",
    });
    
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareTrip = () => {
    if (!trip) return;
    
    const shareLink = `${window.location.origin}/trips/join/${trip.invite_code}`;
    
    if (navigator.share) {
      navigator
        .share({
          title: `Join ${trip.name} on Planit`,
          text: `I'm planning a trip to ${trip.destination} and would like you to join!`,
          url: shareLink,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied!",
        description: "Trip invite link copied to clipboard.",
      });
    }
  };

  const exportTrip = () => {
    // This would be implemented with a more detailed export functionality
    toast({
      title: "Export initiated",
      description: "Your trip details are being prepared for download.",
    });
  };

  const editTrip = () => {
    navigate(`/trips/${tripId}/edit`);
  };

  const resendInvitation = async (invitationId: string) => {
    // This would call a backend function to resend the invitation email
    toast({
      title: "Invitation sent",
      description: "Your invitation has been resent successfully.",
    });
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('trip_invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked.",
      });
      
      // Update the local state to remove the revoked invitation
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error("Error revoking invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke invitation. Please try again.",
      });
    }
  };

  // Calculate trip metrics
  const calculateDaysLeft = () => {
    if (!trip) return 0;
    
    const startDate = parseISO(trip.start_date);
    const today = new Date();
    
    const daysLeft = differenceInDays(startDate, today);
    return daysLeft < 0 ? 0 : daysLeft;
  };

  const calculateTripDuration = () => {
    if (!trip) return 0;
    
    const startDate = parseISO(trip.start_date);
    const endDate = parseISO(trip.end_date);
    
    return differenceInDays(endDate, startDate) + 1;
  };

  const activityCompletionPercentage = () => {
    if (!activities.length) return 0;
    
    const confirmedActivities = activities.filter(a => a.status === "confirmed").length;
    return Math.round((confirmedActivities / activities.length) * 100);
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Hero Section Skeleton */}
          <div className="relative h-64 rounded-xl overflow-hidden">
            <Skeleton className="absolute inset-0" />
            <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
              <Skeleton className="h-8 w-3/5 mb-2" />
              <Skeleton className="h-5 w-2/5" />
            </div>
          </div>
          
          {/* Metrics Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          
          {/* Tabs Skeleton */}
          <div>
            <Skeleton className="h-10 w-full max-w-md mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Trip Not Found</h2>
        <p className="text-gray-600 mb-6">
          The trip you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url}
              alt={trip.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-planit-teal/30 to-planit-navy/30" />
          )}
          
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{trip.name}</h1>
            <div className="flex items-center text-white/90">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{trip.destination}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button size="sm" variant="secondary" onClick={shareTrip}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button size="sm" variant="secondary" onClick={exportTrip}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {currentUserIsOwner && (
              <Button size="sm" variant="secondary" onClick={editTrip}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        {/* Trip Details & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trip Duration */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Trip Duration</p>
                  <p className="text-2xl font-semibold mt-1">
                    {calculateTripDuration()} {calculateTripDuration() === 1 ? "day" : "days"}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-planit-teal/70" />
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 flex justify-between mb-1">
                  <span>
                    {format(parseISO(trip.start_date), "MMM d, yyyy")}
                  </span>
                  <span>
                    {format(parseISO(trip.end_date), "MMM d, yyyy")}
                  </span>
                </div>
                <Progress value={100} className="h-1.5" />
                {calculateDaysLeft() > 0 ? (
                  <p className="text-xs text-right mt-1 text-planit-coral font-medium">
                    {calculateDaysLeft()} days before trip
                  </p>
                ) : (
                  <p className="text-xs text-right mt-1 text-gray-500 font-medium">
                    Trip {new Date() > parseISO(trip.end_date) ? "completed" : "in progress"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Activities Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Activities</p>
                  <p className="text-2xl font-semibold mt-1">
                    {activities.length} {activities.length === 1 ? "activity" : "activities"}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-planit-coral/70" />
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 flex justify-between mb-1">
                  <span>Completion</span>
                  <span>{activityCompletionPercentage()}%</span>
                </div>
                <Progress value={activityCompletionPercentage()} className="h-1.5" />
                <div className="flex justify-between text-xs mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    {activities.filter(a => a.status === "confirmed").length} Confirmed
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                    {activities.filter(a => a.status === "pending").length} Pending
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    {activities.filter(a => a.status === "voting").length} Voting
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Budget */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-2xl font-semibold mt-1">
                    {trip.budget 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: trip.currency,
                        }).format(trip.budget)
                      : "Not set"}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-planit-yellow/70" />
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 flex justify-between mb-1">
                  <span>Per person</span>
                  <span>
                    {trip.budget && participants.length > 0
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: trip.currency,
                          maximumFractionDigits: 0,
                        }).format(trip.budget / participants.length)
                      : "-"}
                  </span>
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Budget
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-planit-navy">
              Participants ({participants.length})
            </h2>
            <Button size="sm">
              <Users className="h-4 w-4 mr-2" />
              Invite More
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={participant.user?.avatar_url || ''} />
                    <AvatarFallback className="bg-planit-teal/20 text-planit-teal">
                      {participant.user?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator - in a real app, this would be dynamic */}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                </div>
                <span className="text-xs mt-1 max-w-[80px] truncate">
                  {participant.user?.full_name || participant.user?.email?.split('@')[0] || 'User'}
                </span>
                {participant.is_owner && (
                  <span className="text-[10px] bg-planit-navy/10 text-planit-navy px-1.5 py-0.5 rounded-full">
                    Owner
                  </span>
                )}
              </div>
            ))}
            
            {invitations.filter(inv => inv.status === "pending").map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col items-center opacity-50"
              >
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarFallback className="bg-gray-100 text-gray-400">
                    {invitation.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1 max-w-[80px] truncate">
                  {invitation.email.split('@')[0]}
                </span>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs
          defaultValue="itinerary"
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="w-full max-w-md mb-4">
            <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
            <TabsTrigger value="activities" className="flex-1">Activities</TabsTrigger>
            <TabsTrigger value="budget" className="flex-1">Budget</TabsTrigger>
            <TabsTrigger value="discussion" className="flex-1">Discussion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="itinerary" className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Your Itinerary</h3>
              {/* Placeholder for itinerary content */}
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Your itinerary will appear here.</p>
                <p className="text-gray-400 text-sm mt-1">Start adding activities to create your daily schedule.</p>
                <Button className="mt-4">Add Activities</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activities" className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Activities</h3>
                <Button>Add Activity</Button>
              </div>
              
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* This would render actual activity cards */}
                  <div className="p-6 text-center rounded-lg border">
                    Sample activity card here
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No activities added yet.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Plan your trip by adding activities for the group.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Budget</h3>
              {trip.budget ? (
                <div>Budget content would appear here</div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No budget has been set for this trip.</p>
                  <Button className="mt-4">Set Budget</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="discussion" className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Discussion</h3>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Start a conversation with your travel companions.</p>
                <Button className="mt-4">Post Comment</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Invite Management */}
        {currentUserIsOwner && invitations.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Invitations</h3>
            <div className="space-y-3">
              {invitations
                .filter(inv => inv.status === "pending")
                .map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Invited {format(parseISO(invitation.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendInvitation(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => revokeInvitation(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Trip Invitation Code */}
        <div className="bg-planit-teal/5 rounded-lg p-6 border border-planit-teal/20">
          <h3 className="text-lg font-semibold mb-4">Trip Sharing</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Invite Code</p>
              <div className="flex items-center">
                <div className="bg-white border rounded-l-md px-4 py-2 font-mono font-medium flex-1">
                  {trip.invite_code}
                </div>
                <Button
                  variant="outline"
                  className="rounded-l-none border-l-0"
                  onClick={copyInviteCode}
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this code with your travel companions so they can join the trip.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={shareTrip}>
                <Share className="mr-2 h-4 w-4" />
                Share Trip Link
              </Button>
              <Button variant="outline" className="flex-1" onClick={exportTrip}>
                <Download className="mr-2 h-4 w-4" />
                Export Trip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDashboard;
