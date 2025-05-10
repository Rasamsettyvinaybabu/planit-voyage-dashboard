
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, MapPin, Phone, Briefcase, Calendar } from "lucide-react";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    occupation: "",
    birthdate: "",
    preferred_currency: "USD",
    travel_preferences: [] as string[]
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImagePreview(event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTravelPreferenceToggle = (preference: string) => {
    setFormData(prev => {
      const currentPrefs = [...prev.travel_preferences];
      
      if (currentPrefs.includes(preference)) {
        return {
          ...prev,
          travel_preferences: currentPrefs.filter(p => p !== preference)
        };
      } else {
        return {
          ...prev,
          travel_preferences: [...currentPrefs, preference]
        };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Upload profile image if selected
      let avatar_url = null;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, profileImage);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: publicURL } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        avatar_url = publicURL.publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          avatar_url: avatar_url ? avatar_url : null,
          // Store additional profile data as JSON
          metadata: {
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
            phone: formData.phone,
            occupation: formData.occupation,
            birthdate: formData.birthdate,
            preferred_currency: formData.preferred_currency,
            travel_preferences: formData.travel_preferences
          }
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-planit-navy">Complete Your Profile</h1>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/dashboard")}
          >
            Skip for now
          </Button>
        </div>
      </div>
      
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 relative">
                <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <Input
                  id="profilePicture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-planit-teal hover:bg-planit-teal/90 transition-colors text-white text-xs px-3 py-1 h-auto rounded-full"
                  onClick={() => document.getElementById("profilePicture")?.click()}
                >
                  {profileImagePreview ? "Change" : "Upload"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">Add a profile photo to personalize your account</p>
            </div>
            
            {/* Basic Information */}
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-planit-navy">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us a little about yourself..."
                    className="mt-1 flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-planit-navy">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="location" className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="website" className="flex items-center">
                      <Globe className="h-4 w-4 mr-1 text-gray-400" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="occupation" className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                      Occupation
                    </Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="Your profession"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="birthdate" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      Birth Date
                    </Label>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Travel Preferences */}
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-planit-navy">Travel Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferred_currency">Preferred Currency</Label>
                  <select
                    id="preferred_currency"
                    name="preferred_currency"
                    value={formData.preferred_currency}
                    onChange={handleChange}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                
                <div>
                  <Label>Travel Style</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Adventure", "Relaxation", "Culture", "Food", "Nature", "History", "Budget", "Luxury"].map(preference => (
                      <button
                        key={preference}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.travel_preferences.includes(preference)
                            ? "bg-planit-teal text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => handleTravelPreferenceToggle(preference)}
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Select all that apply to you</p>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-planit-teal hover:bg-planit-teal/90 transition-colors text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
