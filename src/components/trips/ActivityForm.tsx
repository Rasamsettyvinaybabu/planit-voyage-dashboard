
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Calendar, Clock, DollarSign, Link2, Upload, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ActivityFormProps = {
  tripId: string;
  activity?: {
    id: string;
    title: string;
    description?: string | null;
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    category: "adventure" | "food" | "sightseeing" | "other";
    cost?: number | null;
    external_url?: string | null;
    image_url?: string | null;
    status: "confirmed" | "pending" | "voting";
  };
  currency: string;
  participants: number;
  onSave: (activity: any) => void;
  onCancel: () => void;
};

const activitySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  date: z.date().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  category: z.enum(["adventure", "food", "sightseeing", "other"]),
  cost: z.string().optional(),
  external_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  image_url: z.string().optional(),
  require_voting: z.boolean().default(false),
});

const ActivityForm = ({
  tripId,
  activity,
  currency,
  participants,
  onSave,
  onCancel,
}: ActivityFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(activity?.image_url || null);
  const isEditing = !!activity;
  
  // Form setup
  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title || "",
      description: activity?.description || "",
      date: activity?.date ? new Date(activity.date) : undefined,
      start_time: activity?.start_time || "",
      end_time: activity?.end_time || "",
      location: activity?.location || "",
      location_lat: activity?.location_lat || undefined,
      location_lng: activity?.location_lng || undefined,
      category: activity?.category || "other",
      cost: activity?.cost ? String(activity.cost) : "",
      external_url: activity?.external_url || "",
      image_url: activity?.image_url || "",
      require_voting: activity?.status === "voting" || false,
    },
  });
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;
    
    setIsUploading(true);
    
    try {
      // Upload image to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('activity_images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('activity_images')
        .getPublicUrl(filePath);
        
      if (publicUrlData) {
        const imageUrl = publicUrlData.publicUrl;
        form.setValue('image_url', imageUrl);
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const onSubmit = async (data: z.infer<typeof activitySchema>) => {
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const formattedData = {
        trip_id: tripId,
        title: data.title,
        description: data.description || null,
        date: data.date ? format(data.date, "yyyy-MM-dd") : null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        location_lat: data.location_lat || null,
        location_lng: data.location_lng || null,
        category: data.category,
        cost: data.cost ? parseFloat(data.cost) : null,
        external_url: data.external_url || null,
        image_url: data.image_url || null,
        status: data.require_voting ? "voting" : "pending",
        created_by: user.id,
      };
      
      onSave(formattedData);
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Error saving activity. Please try again.");
    }
  };
  
  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image_url', '');
  };
  
  const costPerPerson = form.watch('cost')
    ? parseFloat(form.watch('cost')) / participants
    : 0;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Title*</FormLabel>
              <FormControl>
                <Input placeholder="Eiffel Tower Visit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="adventure">
                      <div className="flex items-center">
                        <span className="mr-2">🏄‍♂️</span>
                        <span>Adventure</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="food">
                      <div className="flex items-center">
                        <span className="mr-2">🍽️</span>
                        <span>Food</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sightseeing">
                      <div className="flex items-center">
                        <span className="mr-2">🏛️</span>
                        <span>Sightseeing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center">
                        <span className="mr-2">📌</span>
                        <span>Other</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      type="time" 
                      className="pl-9" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      type="time" 
                      className="pl-9" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the activity..."
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input placeholder="Enter location" className="pl-9" {...field} value={field.value || ""} />
                </div>
              </FormControl>
              <FormMessage />
              {/* Future enhancement: Add map integration for location selection */}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="pl-9" 
                    {...field} 
                    value={field.value || ""}
                  />
                  <div className="absolute right-3 top-2 text-xs text-gray-500">
                    {currency}
                  </div>
                </div>
              </FormControl>
              {participants > 0 && field.value && parseFloat(field.value) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(costPerPerson)} per person
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="external_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External Link</FormLabel>
              <FormControl>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input placeholder="https://..." className="pl-9" {...field} value={field.value || ""} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <div>
                  {imagePreview ? (
                    <div className="relative rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-40 object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Upload an image for your activity
                      </p>
                      <input
                        type="file"
                        id="activity-image"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById("activity-image")?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Select Image"}
                      </Button>
                    </div>
                  )}
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <FormField
          control={form.control}
          name="require_voting"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Require group voting
                </FormLabel>
                <p className="text-sm text-gray-500">
                  Group members will be able to vote on this activity before it's confirmed.
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Save Changes" : "Add Activity"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ActivityForm;
