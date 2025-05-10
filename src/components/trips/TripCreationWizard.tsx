import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar, Map, Upload, Users, ChevronLeft, ChevronRight, Copy, MapPin, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Currency options
const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
];

// Form schemas for each step
const basicInfoSchema = z.object({
  name: z.string().min(2, "Trip name must be at least 2 characters").max(50, "Trip name must be less than 50 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  dateRange: z.object({
    from: z.date({ required_error: "Start date is required" }),
    to: z.date({ required_error: "End date is required" }),
  }).refine(data => data.from <= data.to, {
    message: "End date must be after start date",
    path: ["to"],
  }),
  budget: z.string().optional(),
  currency: z.string().default("USD"),
});

const tripDetailsSchema = z.object({
  description: z.string().optional(),
  privacy: z.enum(["public", "private"]).default("private"),
  coverImageUrl: z.string().optional(),
});

const inviteCollaboratorsSchema = z.object({
  emails: z.string().optional(),
});

// Union type for all steps
type FormData = 
  | z.infer<typeof basicInfoSchema> 
  | z.infer<typeof tripDetailsSchema>
  | z.infer<typeof inviteCollaboratorsSchema>;

type StepState = {
  isValid: boolean;
  data: any;
};

const TripCreationWizard = () => {
  const [step, setStep] = useState(1);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [tripInviteCode, setTripInviteCode] = useState("");
  const [tripInviteLink, setTripInviteLink] = useState("");
  const [steps, setSteps] = useState<StepState[]>([
    { isValid: false, data: null },
    { isValid: false, data: null },
    { isValid: false, data: null },
  ]);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form for step 1
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      destination: "",
      budget: "",
      currency: "USD",
    },
  });

  // Form for step 2
  const tripDetailsForm = useForm<z.infer<typeof tripDetailsSchema>>({
    resolver: zodResolver(tripDetailsSchema),
    defaultValues: {
      description: "",
      privacy: "private",
      coverImageUrl: "",
    },
  });

  // Form for step 3
  const inviteCollaboratorsForm = useForm<z.infer<typeof inviteCollaboratorsSchema>>({
    resolver: zodResolver(inviteCollaboratorsSchema),
    defaultValues: {
      emails: "",
    },
  });

  // Handle basic info submission
  const onBasicInfoSubmit = async (data: z.infer<typeof basicInfoSchema>) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[0] = { isValid: true, data };
      return newSteps;
    });
    setStep(2);
  };

  // Handle trip details submission
  const onTripDetailsSubmit = async (data: z.infer<typeof tripDetailsSchema>) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[1] = { isValid: true, data };
      return newSteps;
    });
    setStep(3);
  };

  // Handle invite collaborators submission
  const onInviteCollaboratorsSubmit = async () => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[2] = { isValid: true, data: { emails: emailList } };
      return newSteps;
    });
    
    await createTrip();
  };

  // Handle file upload for cover image
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;
    
    setIsUploading(true);
    
    try {
      // Upload image to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('trip_images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('trip_images')
        .getPublicUrl(filePath);
        
      if (publicUrlData) {
        const imageUrl = publicUrlData.publicUrl;
        tripDetailsForm.setValue('coverImageUrl', imageUrl);
        setCoverImagePreview(imageUrl);
        
        toast({
          title: "Image uploaded",
          description: "Cover image has been uploaded successfully.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading the image.",
      });
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Add email to list
  const addEmail = () => {
    if (!newEmail.trim()) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    
    if (emailList.includes(newEmail)) {
      toast({
        variant: "destructive",
        title: "Email already added",
        description: "This email is already in the list.",
      });
      return;
    }
    
    setEmailList((prev) => [...prev, newEmail]);
    setNewEmail("");
  };

  // Remove email from list
  const removeEmail = (email: string) => {
    setEmailList((prev) => prev.filter((e) => e !== email));
  };

  // Create trip
  const createTrip = async () => {
    setIsCreatingTrip(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in to create a trip.",
        });
        return;
      }
      
      const basicInfo = steps[0].data;
      const tripDetails = steps[1].data;
      
      // Insert trip into database - fix by passing a single object instead of an array
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          name: basicInfo.name,
          destination: basicInfo.destination,
          start_date: basicInfo.dateRange.from,
          end_date: basicInfo.dateRange.to,
          budget: basicInfo.budget ? parseFloat(basicInfo.budget) : null,
          currency: basicInfo.currency,
          description: tripDetails.description,
          privacy: tripDetails.privacy,
          cover_image_url: tripDetails.coverImageUrl,
          user_id: user.id,
          // Note: invite_code is generated automatically by a database trigger
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Send invitations to all emails
      if (emailList.length > 0 && trip) {
        const invitations = emailList.map((email) => ({
          trip_id: trip.id,
          email,
          invited_by: user.id,
        }));
        
        const { error: inviteError } = await supabase
          .from('trip_invitations')
          .insert(invitations);
          
        if (inviteError) console.error("Error sending invitations:", inviteError);
      }
      
      // Show confetti animation and set trip link
      if (trip) {
        setTripInviteCode(trip.invite_code);
        setTripInviteLink(`${window.location.origin}/trips/join/${trip.invite_code}`);
        setIsConfettiActive(true);
        
        setTimeout(() => {
          navigate(`/trips/${trip.id}`);
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        variant: "destructive",
        title: "Failed to create trip",
        description: "There was an error creating your trip. Please try again.",
      });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    navigator.clipboard.writeText(tripInviteCode);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard.",
    });
  };

  // Copy invite link to clipboard
  const copyInviteLink = () => {
    navigator.clipboard.writeText(tripInviteLink);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Form {...basicInfoForm}>
            <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-6">
              <FormField
                control={basicInfoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Summer vacation in Italy" {...field} maxLength={50} />
                        <div className="absolute right-3 top-2 text-xs text-gray-500">
                          {field.value.length}/50
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={basicInfoForm.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="Rome, Italy" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={basicInfoForm.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Trip Dates</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!field.value?.from ? "text-muted-foreground" : ""}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Select date range</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={field.value as any}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={basicInfoForm.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Trip Budget (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="5000" className="pl-9" type="number" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicInfoForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                
              <div className="flex justify-end pt-4">
                <Button type="submit">
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 2:
        return (
          <Form {...tripDetailsForm}>
            <form onSubmit={tripDetailsForm.handleSubmit(onTripDetailsSubmit)} className="space-y-6">
              <FormField
                control={tripDetailsForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your fellow travelers what this trip is all about..."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={tripDetailsForm.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Trip Privacy</FormLabel>
                        <p className="text-sm text-gray-500">
                          {field.value === "private" 
                            ? "Only invited travelers can view and edit trip details" 
                            : "Anyone with the link can view trip details (but not edit)"}
                        </p>
                      </div>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="privacy-toggle">
                            {field.value === "private" ? "Private" : "Public"}
                          </Label>
                          <Switch
                            id="privacy-toggle"
                            checked={field.value === "public"}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? "public" : "private")
                            }
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={tripDetailsForm.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {coverImagePreview ? (
                          <div className="relative">
                            <img
                              src={coverImagePreview}
                              alt="Cover preview"
                              className="w-full h-48 rounded-md object-cover"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setCoverImagePreview(null);
                                field.onChange("");
                              }}
                            >
                              Change Image
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                            <Upload className="mx-auto h-10 w-10 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              Upload a cover image for your trip
                            </p>
                            <input
                              type="file"
                              id="cover-image"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleCoverImageUpload}
                              disabled={isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-4"
                              onClick={() => document.getElementById("cover-image")?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Select Image"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit">
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Invite Collaborators</h3>
              <p className="text-sm text-gray-500">
                Invite friends and family to collaborate on this trip. You can add more people later.
              </p>
            </div>
              
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                />
                <Button type="button" onClick={addEmail}>
                  Add
                </Button>
              </div>
                
              {emailList.length > 0 && (
                <div className="border rounded-md p-3">
                  <p className="text-sm font-medium mb-2">Email Invitations:</p>
                  <div className="space-y-2">
                    {emailList.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <span className="text-sm">{email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => removeEmail(email)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  You can also share a special invite code or link after creating the trip.
                </p>
              </div>
            </div>
              
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={onInviteCollaboratorsSubmit} disabled={isCreatingTrip}>
                {isCreatingTrip ? (
                  <>Creating Trip...</>
                ) : (
                  <>Create Trip</>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 4: // Success screen with confetti
        return (
          <div className="text-center py-8">
            <div className="mb-6 text-planit-teal">
              <svg
                className="mx-auto h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
              
            <h2 className="text-2xl font-bold text-planit-navy">Trip Created Successfully!</h2>
            <p className="text-gray-600 mt-2 mb-6">
              Your trip has been created. Share these details with your travelers:
            </p>
              
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <p className="text-sm text-gray-500">Invite Code</p>
                  <p className="font-mono font-medium">{tripInviteCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyInviteCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
                
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex-1 truncate">
                  <p className="text-sm text-gray-500">Invite Link</p>
                  <p className="font-medium text-sm truncate">{tripInviteLink}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-2"
                  onClick={copyInviteLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
              
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate(`/trips/`)}
            >
              View My Trip
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  // When a trip is successfully created
  useEffect(() => {
    if (isConfettiActive) {
      setStep(4); // Move to success screen
      
      // Optional: Reset form state after a delay
      const timer = setTimeout(() => {
        setIsConfettiActive(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isConfettiActive]);

  const stepInfo = [
    { icon: <Calendar className="h-5 w-5" />, label: "Basic Info" },
    { icon: <Map className="h-5 w-5" />, label: "Trip Details" },
    { icon: <Users className="h-5 w-5" />, label: "Invite Friends" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Confetti effect */}
      {isConfettiActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Animated confetti will be rendered here */}
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={`confetti bg-${
                  ["planit-teal", "planit-coral", "planit-yellow"][i % 3]
                } animate-confetti-${i % 5}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-planit-navy">Create New Trip</CardTitle>
          <CardDescription>
            Fill out the details below to start planning your adventure.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress bar */}
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{Math.floor((step / 3) * 100)}%</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {stepInfo.map((info, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-planit-teal/10 border border-planit-teal/20"
                      : isCompleted
                      ? "bg-planit-teal/5 border border-planit-teal/10"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-planit-teal text-white"
                        : isCompleted
                        ? "bg-planit-teal/20 text-planit-teal"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {info.icon}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? "text-planit-teal" : "text-gray-500"
                    }`}
                  >
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator className="mb-8" />

          {/* Step content */}
          <div>{renderStepContent()}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripCreationWizard;
