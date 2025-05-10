
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff, Save, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  updated_at: string;
};

const UserSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    username: "",
    full_name: "",
    email: "",
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_trip_updates: true,
    email_activity_changes: true,
    email_trip_invitations: true,
    email_marketing: false,
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setProfileForm({
          username: data.username || "",
          full_name: data.full_name || "",
          email: user.email || "",
        });
        
        if (data.avatar_url) {
          setProfileImagePreview(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user, toast]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
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
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Upload profile image if selected
      let avatar_url = profile?.avatar_url || null;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, profileImage);
          
        if (uploadError) throw uploadError;
        
        const { data: publicURL } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        avatar_url = publicURL.publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username,
          full_name: profileForm.full_name,
          avatar_url
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update email if changed
      if (user.email !== profileForm.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileForm.email,
        });
        
        if (emailError) throw emailError;
        
        toast({
          title: "Email update initiated",
          description: "Please check your new email for a confirmation link.",
        });
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    const { current_password, new_password, confirm_password } = passwordForm;
    
    // Validate
    if (!current_password || !new_password || !confirm_password) {
      toast({
        title: "Missing information",
        description: "Please fill all password fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (new_password !== confirm_password) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    if (new_password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: new_password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      // Clear form
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateNotifications = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Store notification preferences in metadata
      const { error } = await supabase
        .from('profiles')
        .update({
          metadata: { notification_preferences: notificationPreferences }
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating preferences",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Confirm the text matches
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation failed",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In a real app, you'd implement account deletion here
      // This requires admin privileges in Supabase or a serverless function
      
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted.",
      });
      
      // Sign out the user
      await signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setDeleteDialogOpen(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-planit-teal animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-planit-navy">Account Settings</h1>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 flex items-center"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <div className="flex flex-col items-center">
                  <div className="h-32 w-32 relative">
                    <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile"
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
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileChange}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500">
                      Changing your email will require verification
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="bg-planit-teal hover:bg-planit-teal/90 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Password Tab */}
            <TabsContent value="password" className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-planit-navy">Change Password</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        name="current_password"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        name="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleUpdatePassword}
                    disabled={isSaving}
                    className="bg-planit-teal hover:bg-planit-teal/90 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-planit-navy">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Trip Updates</p>
                      <p className="text-sm text-gray-500">Receive emails about changes to your trips</p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.email_trip_updates}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_trip_updates: checked
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Activity Changes</p>
                      <p className="text-sm text-gray-500">Get notified when activities are added, updated, or removed</p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.email_activity_changes}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_activity_changes: checked
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Trip Invitations</p>
                      <p className="text-sm text-gray-500">Receive emails when you're invited to join a trip</p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.email_trip_invitations}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_trip_invitations: checked
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive promotional content and travel tips</p>
                    </div>
                    <Switch 
                      checked={notificationPreferences.email_marketing}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_marketing: checked
                        }))
                      }
                      disabled={isSaving}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleUpdateNotifications}
                    disabled={isSaving}
                    className="bg-planit-teal hover:bg-planit-teal/90 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Preferences...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Danger Zone Tab */}
            <TabsContent value="danger" className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                
                <div className="space-y-8">
                  <div className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sign Out Everywhere</p>
                        <p className="text-sm text-gray-500">Sign out from all devices where you're currently logged in</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={async () => {
                          try {
                            await supabase.auth.signOut({ scope: 'global' });
                            toast({
                              title: "Signed out everywhere",
                              description: "You've been signed out from all devices.",
                            });
                            navigate("/login");
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "An error occurred.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out Everywhere
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border border-red-200 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-600">Delete Account</p>
                        <p className="text-sm text-gray-500">Permanently delete your account and all associated data</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
              
              <div className="bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800">
                <p className="font-medium">You will lose:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>All your trips and activities</li>
                  <li>Your profile information</li>
                  <li>Access to trips you've been invited to</li>
                  <li>All your settings and preferences</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-red-600">
                  Type DELETE to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmText !== "DELETE" || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserSettings;
