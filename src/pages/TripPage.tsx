
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Components
import TripDashboard from "@/components/trips/TripDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const TripPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login', { state: { redirect: `/trips/${tripId}` } });
          return;
        }

        if (!tripId) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Check if user is a participant of this trip
        const { data, error } = await supabase
          .from('trip_participants')
          .select('id')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          // User is not a participant, check if trip is public
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('privacy')
            .eq('id', tripId)
            .single();

          if (tripError || !tripData) {
            setHasAccess(false);
          } else if (tripData.privacy === 'public') {
            setHasAccess(true);
          } else {
            // Check if user has a pending invitation
            const { data: invitationData, error: invitationError } = await supabase
              .from('trip_invitations')
              .select('id, email, status')
              .eq('trip_id', tripId)
              .eq('email', user.email)
              .single();

            if (!invitationError && invitationData) {
              // User has been invited but hasn't joined yet
              if (invitationData.status === 'pending') {
                navigate(`/trips/join/${tripId}`, { state: { invitation: invitationData } });
                return;
              }
            }

            setHasAccess(false);
          }
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load trip. Please try again later.",
        });
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [tripId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold text-planit-navy mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          You don't have access to this trip. You might need an invitation from a trip participant,
          or the trip might not exist.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <TripDashboard />;
};

export default TripPage;
