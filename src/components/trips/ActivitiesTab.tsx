import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter, Settings } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Custom Components
import ActivityCard from "./ActivityCard";
import ActivityForm from "./ActivityForm";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  external_url: string | null;
  image_url: string | null;
  cost: number | null;
  category: "adventure" | "food" | "sightseeing" | "other";
  status: "confirmed" | "pending" | "voting";
  created_by: string;
};

type Vote = {
  id: string;
  activity_id: string;
  user_id: string;
  vote: boolean;
  user?: {
    id: string;
    avatar_url: string | null;
    full_name: string | null;
  };
};

type Participant = {
  id: string;
  user_id: string;
  is_owner: boolean;
};

type Trip = {
  id: string;
  currency: string;
};

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Voting", value: "voting" },
];

const categoryOptions = [
  { label: "All Categories", value: "all" },
  { label: "Adventure", value: "adventure" },
  { label: "Food", value: "food" },
  { label: "Sightseeing", value: "sightseeing" },
  { label: "Other", value: "other" },
];

const sortOptions = [
  { label: "Date (Ascending)", value: "date_asc" },
  { label: "Date (Descending)", value: "date_desc" },
  { label: "Name (A-Z)", value: "name_asc" },
  { label: "Name (Z-A)", value: "name_desc" },
  { label: "Category", value: "category" },
];

const ActivitiesTab = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");
  const [groupByDate, setGroupByDate] = useState(false);
  
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!tripId) return;
      
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
        
        // Fetch trip
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, currency')
          .eq('id', tripId)
          .single();
        
        if (tripError) throw tripError;
        setTrip(tripData as Trip);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select('id, user_id, is_owner')
          .eq('trip_id', tripId);
        
        if (participantsError) throw participantsError;
        setParticipants(participantsData);
        
        // Check if current user is owner
        if (user) {
          const isOwner = participantsData.some(
            p => p.user_id === user.id && p.is_owner
          );
          setIsCurrentUserOwner(isOwner);
        }
        
        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('trip_id', tripId)
          .order('date', { ascending: true });
        
        if (activitiesError) throw activitiesError;
        setActivities(activitiesData as Activity[]);
        setFilteredActivities(activitiesData as Activity[]);
        
        // Fetch votes
        const { data: votesData, error: votesError } = await supabase
          .from('activity_votes')
          .select(`
            id, 
            activity_id, 
            user_id, 
            vote,
            user:profiles(
              id, 
              avatar_url, 
              full_name
            )
          `)
          .in(
            'activity_id', 
            activitiesData.map((a: any) => a.id)
          );
        
        if (!votesError && votesData) {
          setVotes(votesData as Vote[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load activities. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [tripId, toast]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!tripId) return;
    
    // Activities changes
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
        async (payload) => {
          // Refetch all activities to keep everything in sync
          const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('trip_id', tripId);
            
          if (!error && data) {
            setActivities(data);
            applyFilters(data, searchQuery, statusFilter, categoryFilter, sortBy);
          }
        }
      )
      .subscribe();
    
    // Votes changes
    const votesSubscription = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_votes',
        },
        async () => {
          // Fetch all activity IDs
          const activityIds = activities.map(a => a.id);
          
          if (activityIds.length > 0) {
            const { data, error } = await supabase
              .from('activity_votes')
              .select(`
                id, 
                activity_id, 
                user_id, 
                vote,
                user:profiles(
                  id, 
                  avatar_url, 
                  full_name
                )
              `)
              .in('activity_id', activityIds);
              
            if (!error && data) {
              setVotes(data);
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      activitiesSubscription.unsubscribe();
      votesSubscription.unsubscribe();
    };
  }, [tripId, activities]);

  // Filter and sort activities
  const applyFilters = (
    acts: Activity[], 
    query: string, 
    status: string, 
    category: string, 
    sort: string
  ) => {
    let filtered = [...acts];
    
    // Apply search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(lowerQuery) || 
          (a.description && a.description.toLowerCase().includes(lowerQuery)) ||
          (a.location && a.location.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(a => a.status === status);
    }
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    // Apply sorting
    switch (sort) {
      case 'date_asc':
        filtered.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        break;
      case 'date_desc':
        filtered.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        break;
    }
    
    setFilteredActivities(filtered);
  };

  useEffect(() => {
    applyFilters(activities, searchQuery, statusFilter, categoryFilter, sortBy);
  }, [searchQuery, statusFilter, categoryFilter, sortBy, activities]);

  // Open dialog to add/edit activity
  const openActivityDialog = (activity?: Activity) => {
    setCurrentActivity(activity);
    setIsDialogOpen(true);
  };

  // Save activity
  const handleSaveActivity = async (formData: any) => {
    try {
      if (currentActivity) {
        // Update existing activity
        const { data, error } = await supabase
          .from('activities')
          .update({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            location: formData.location,
            location_lat: formData.location_lat,
            location_lng: formData.location_lng,
            external_url: formData.external_url,
            image_url: formData.image_url,
            cost: formData.cost,
            category: formData.category,
            status: formData.status,
          })
          .eq('id', currentActivity.id)
          .select()
          .single();
          
        if (error) throw error;
        
        toast({
          title: "Activity Updated",
          description: "The activity has been updated successfully.",
        });
      } else {
        // Create new activity
        const { data, error } = await supabase
          .from('activities')
          .insert([formData])
          .select()
          .single();
          
        if (error) throw error;
        
        toast({
          title: "Activity Created",
          description: "The new activity has been added successfully.",
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save activity. Please try again.",
      });
    }
  };

  // Delete activity
  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);
        
      if (error) throw error;
      
      toast({
        title: "Activity Deleted",
        description: "The activity has been deleted successfully.",
      });
      
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete activity. Please try again.",
      });
    }
  };

  // Handle voting
  const handleVote = async (activityId: string, voteValue: boolean) => {
    if (!currentUserId || !tripId) return;
    
    try {
      // Check if user has already voted
      const existingVote = votes.find(
        v => v.activity_id === activityId && v.user_id === currentUserId
      );
      
      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('activity_votes')
          .update({ vote: voteValue })
          .eq('id', existingVote.id);
          
        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('activity_votes')
          .insert([{
            activity_id: activityId,
            user_id: currentUserId,
            vote: voteValue,
          }]);
          
        if (error) throw error;
      }
      
      toast({
        title: "Vote Recorded",
        description: `You voted ${voteValue ? "for" : "against"} this activity.`,
      });
    } catch (error) {
      console.error("Error recording vote:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record your vote. Please try again.",
      });
    }
  };

  // Finalize voting
  const handleFinalizeVote = async (activityId: string, newStatus: "confirmed" | "pending") => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: newStatus })
        .eq('id', activityId);
        
      if (error) throw error;
      
      // Update local state
      setActivities(activities.map(a => 
        a.id === activityId ? { ...a, status: newStatus } : a
      ));
    } catch (error) {
      console.error("Error finalizing vote:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to finalize voting. Please try again.",
      });
    }
  };

  // Get user vote for an activity
  const getUserVote = (activityId: string) => {
    if (!currentUserId) return { hasVoted: false, vote: null };
    
    const userVote = votes.find(
      v => v.activity_id === activityId && v.user_id === currentUserId
    );
    
    return {
      hasVoted: !!userVote,
      vote: userVote ? userVote.vote : null,
    };
  };

  // Get votes for an activity
  const getActivityVotes = (activityId: string) => {
    return votes.filter(v => v.activity_id === activityId);
  };

  // Check if user is activity creator
  const isCreator = (createdBy: string) => {
    return currentUserId === createdBy;
  };

  // Group activities by date
  const groupActivitiesByDate = () => {
    const grouped: { [key: string]: Activity[] } = {};
    
    filteredActivities.forEach(activity => {
      if (activity.date) {
        if (!grouped[activity.date]) {
          grouped[activity.date] = [];
        }
        grouped[activity.date].push(activity);
      } else {
        if (!grouped["unscheduled"]) {
          grouped["unscheduled"] = [];
        }
        grouped["unscheduled"].push(activity);
      }
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-8">
        <p>Trip information not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <h2 className="text-xl font-semibold text-planit-navy">
          Activities ({filteredActivities.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <Button onClick={() => openActivityDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="flex-grow sm:flex-grow-0"
        >
          <TabsList className="w-full grid grid-cols-4">
            {filterOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="text-xs sm:text-sm px-1 sm:px-3"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              {categoryOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={categoryFilter === option.value}
                  onCheckedChange={() => setCategoryFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              {sortOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={sortBy === option.value}
                  onCheckedChange={() => setSortBy(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={groupByDate}
                onCheckedChange={() => setGroupByDate(!groupByDate)}
              >
                Group by Date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Activities Grid */}
      {filteredActivities.length > 0 ? (
        groupByDate ? (
          // Grouped by date view
          <div className="space-y-8">
            {Object.entries(groupActivitiesByDate()).map(([date, dateActivities]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-3 text-planit-navy">
                  {date === "unscheduled" ? "Unscheduled" : new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dateActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      votes={getActivityVotes(activity.id)}
                      participants={participants.length}
                      currency={trip.currency}
                      isCreator={isCreator(activity.created_by)}
                      isOwner={isCurrentUserOwner}
                      userHasVoted={getUserVote(activity.id).hasVoted}
                      userVoteValue={getUserVote(activity.id).vote}
                      onEdit={() => openActivityDialog(activity)}
                      onDelete={handleDeleteActivity}
                      onVote={handleVote}
                      onFinalizeVote={handleFinalizeVote}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular grid view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                votes={getActivityVotes(activity.id)}
                participants={participants.length}
                currency={trip.currency}
                isCreator={isCreator(activity.created_by)}
                isOwner={isCurrentUserOwner}
                userHasVoted={getUserVote(activity.id).hasVoted}
                userVoteValue={getUserVote(activity.id).vote}
                onEdit={() => openActivityDialog(activity)}
                onDelete={handleDeleteActivity}
                onVote={handleVote}
                onFinalizeVote={handleFinalizeVote}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-600">No activities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters or search query"
              : "Start planning your trip by adding an activity"}
          </p>
          <Button
            onClick={() => openActivityDialog()}
            className="mt-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      )}
      
      {/* Add/Edit Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentActivity ? "Edit Activity" : "Add New Activity"}
            </DialogTitle>
          </DialogHeader>
          
          {tripId && trip && (
            <ActivityForm
              tripId={tripId}
              activity={currentActivity}
              currency={trip.currency}
              participants={participants.length}
              onSave={handleSaveActivity}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivitiesTab;
