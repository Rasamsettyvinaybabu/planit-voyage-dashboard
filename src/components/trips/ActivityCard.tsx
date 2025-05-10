
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ThumbsUp, ThumbsDown, Edit, Trash2, MapPin, Calendar, Clock, DollarSign, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Components
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ActivityCategory = "adventure" | "food" | "sightseeing" | "other";
type ActivityStatus = "confirmed" | "pending" | "voting";

type Vote = {
  id: string;
  user_id: string;
  vote: boolean;
  user?: {
    id: string;
    avatar_url: string | null;
    full_name: string | null;
  };
};

type ActivityCardProps = {
  activity: {
    id: string;
    title: string;
    description?: string | null;
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    external_url?: string | null;
    image_url?: string | null;
    cost?: number | null;
    category: ActivityCategory;
    status: ActivityStatus;
    created_by: string;
  };
  votes: Vote[];
  participants: number;
  currency: string;
  isCreator: boolean;
  isOwner: boolean;
  userHasVoted?: boolean | null;
  userVoteValue?: boolean | null;
  onEdit: (activityId: string) => void;
  onDelete: (activityId: string) => void;
  onVote: (activityId: string, vote: boolean) => void;
  onFinalizeVote: (activityId: string, status: ActivityStatus) => void;
};

const getCategoryStyles = (category: ActivityCategory) => {
  switch (category) {
    case "adventure":
      return {
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        iconColor: "text-blue-500",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-800",
      };
    case "food":
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        iconColor: "text-green-500",
        badgeBg: "bg-green-100",
        badgeText: "text-green-800",
      };
    case "sightseeing":
      return {
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        iconColor: "text-purple-500",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-800",
      };
    default:
      return {
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        iconColor: "text-amber-500",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-800",
      };
  }
};

const getStatusStyles = (status: ActivityStatus) => {
  switch (status) {
    case "confirmed":
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    case "pending":
      return {
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
      };
    case "voting":
      return {
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    default:
      return {
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
      };
  }
};

const getCategoryIcon = (category: ActivityCategory) => {
  switch (category) {
    case "adventure":
      return "🏄‍♂️";
    case "food":
      return "🍽️";
    case "sightseeing":
      return "🏛️";
    default:
      return "📌";
  }
};

const ActivityCard = ({
  activity,
  votes,
  participants,
  currency,
  isCreator,
  isOwner,
  userHasVoted,
  userVoteValue,
  onEdit,
  onDelete,
  onVote,
  onFinalizeVote,
}: ActivityCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const { toast } = useToast();
  
  const categoryStyles = getCategoryStyles(activity.category);
  const statusStyles = getStatusStyles(activity.status);
  
  // Calculate vote statistics
  const upvotes = votes.filter((v) => v.vote === true).length;
  const downvotes = votes.filter((v) => v.vote === false).length;
  const totalVotes = votes.length;
  const votePercentage = participants > 0
    ? Math.round((upvotes / participants) * 100)
    : 0;
  
  // Format cost per person
  const costPerPerson = activity.cost && participants > 0
    ? activity.cost / participants
    : null;
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(activity.id);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleVote = (vote: boolean) => {
    onVote(activity.id, vote);
  };
  
  const handleFinalizeVote = () => {
    // If more upvotes, confirm the activity; otherwise, mark it as rejected
    const newStatus: ActivityStatus = upvotes > downvotes ? "confirmed" : "pending";
    onFinalizeVote(activity.id, newStatus);
    
    toast({
      title: newStatus === "confirmed" ? "Activity confirmed!" : "Activity needs revision",
      description: newStatus === "confirmed" 
        ? "The activity has been added to the itinerary."
        : "The activity didn't receive enough votes.",
    });
  };

  return (
    <Card className={`overflow-hidden border-l-4 ${categoryStyles.borderColor} transition-all hover:shadow-md`}>
      {activity.image_url && (
        <div className="h-32 w-full overflow-hidden">
          <img 
            src={activity.image_url} 
            alt={activity.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className={`${categoryStyles.bgColor} py-3 px-4`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2 flex-1">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-lg">
              {getCategoryIcon(activity.category)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${categoryStyles.textColor} truncate`}>
                {activity.title}
              </h3>
              <Badge 
                variant="outline" 
                className={`${statusStyles.bgColor} ${statusStyles.textColor} border-none`}
              >
                {activity.status === "confirmed" ? "Confirmed" : 
                 activity.status === "pending" ? "Pending" : "Voting"}
              </Badge>
            </div>
          </div>
          
          {(isCreator || isOwner) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(activity.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600" 
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the activity "{activity.title}". 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="py-4 px-4 space-y-3">
        {activity.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          {activity.date && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>{format(parseISO(activity.date), "MMM d, yyyy")}</span>
            </div>
          )}
          
          {(activity.start_time || activity.end_time) && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {activity.start_time 
                  ? activity.end_time 
                    ? `${activity.start_time.slice(0, 5)} - ${activity.end_time.slice(0, 5)}`
                    : `${activity.start_time.slice(0, 5)}`
                  : `${activity.end_time?.slice(0, 5)}`}
              </span>
            </div>
          )}
          
          {activity.location && (
            <div className="flex items-center col-span-2">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          
          {activity.cost && (
            <div className="flex items-center col-span-2">
              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <span>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(activity.cost)}</span>
                
                {costPerPerson && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                    }).format(costPerPerson)}/person)
                  </span>
                )}
              </div>
            </div>
          )}
          
          {activity.external_url && (
            <div className="flex items-center col-span-2">
              <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
              <a 
                href={activity.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-planit-teal truncate hover:underline"
              >
                {new URL(activity.external_url).hostname}
              </a>
            </div>
          )}
        </div>
        
        {/* Voting Section */}
        {activity.status === "voting" && (
          <div className="mt-2 pt-3 border-t">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">Votes</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowVoters(!showVoters)}
                    >
                      {showVoters ? "Hide voters" : "Show voters"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showVoters 
                      ? "Hide who has voted" 
                      : "See who has voted"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${votePercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center">
                <ThumbsUp className="h-3 w-3 mr-1 text-green-500" />
                <span>{upvotes} Yes</span>
              </div>
              <span>{totalVotes} of {participants} voted</span>
              <div className="flex items-center">
                <span>{downvotes} No</span>
                <ThumbsDown className="h-3 w-3 ml-1 text-red-500" />
              </div>
            </div>
            
            {showVoters && votes.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Voters:</p>
                <div className="flex flex-wrap gap-1">
                  {votes.map((vote) => (
                    <TooltipProvider key={vote.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={vote.user?.avatar_url || ''} />
                              <AvatarFallback className={vote.vote ? "bg-green-100" : "bg-red-100"}>
                                {vote.user?.full_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 rounded-full h-3 w-3 border border-white ${
                              vote.vote ? "bg-green-500" : "bg-red-500"
                            }`}></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {vote.user?.full_name || "User"}: 
                            <span className={`ml-1 font-medium ${vote.vote ? "text-green-600" : "text-red-600"}`}>
                              {vote.vote ? "Yes" : "No"}
                            </span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Card Footer with Actions */}
      <CardFooter className="py-3 px-4 bg-gray-50 border-t">
        {activity.status === "voting" ? (
          <>
            {isOwner ? (
              <Button 
                className="w-full"
                onClick={handleFinalizeVote}
                disabled={totalVotes === 0}
              >
                Finalize Vote
              </Button>
            ) : (
              <div className="w-full flex gap-2">
                <Button
                  variant={userVoteValue === true ? "default" : "outline"}
                  onClick={() => handleVote(true)}
                  className={`flex-1 ${userVoteValue === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                  disabled={userHasVoted === true && userVoteValue === false}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={userVoteValue === false ? "default" : "outline"}
                  onClick={() => handleVote(false)}
                  className={`flex-1 ${userVoteValue === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                  disabled={userHasVoted === true && userVoteValue === true}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            )}
          </>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onEdit(activity.id)}
          >
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ActivityCard;
