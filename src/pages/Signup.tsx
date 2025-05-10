
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

type StepType = "basic" | "profile" | "confirmation";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>("basic");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    bio: "",
    preferredCurrency: "USD",
    travelPreferences: [] as string[],
  });
  
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (name in errors) {
      setErrors({ ...errors, [name]: "" });
    }
    
    // Special handling for username availability check
    if (name === "username" && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === "username") {
      setUsernameAvailable(null);
    }
  };
  
  const checkUsernameAvailability = async (username: string) => {
    // Debounce the check
    setUsernameChecking(true);
    
    try {
      // In a real app, this would check against your database
      // For now, let's simulate a check with a setTimeout and random result
      setTimeout(() => {
        // 80% chance username is available (for demo purposes)
        const isAvailable = Math.random() > 0.2;
        setUsernameAvailable(isAvailable);
        setUsernameChecking(false);
      }, 500);
      
      // With Supabase, you would do something like:
      // const { data } = await supabase
      //   .from('profiles')
      //   .select('username')
      //   .eq('username', username)
      //   .maybeSingle();
      // setUsernameAvailable(!data);
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameChecking(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result.toString());
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleTravelPreferenceToggle = (preference: string) => {
    setFormData(prev => {
      const currentPrefs = [...prev.travelPreferences];
      
      if (currentPrefs.includes(preference)) {
        return {
          ...prev,
          travelPreferences: currentPrefs.filter(p => p !== preference)
        };
      } else {
        return {
          ...prev,
          travelPreferences: [...currentPrefs, preference]
        };
      }
    });
  };
  
  const validateBasicInfo = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      valid = false;
    } else {
      newErrors.email = "";
    }
    
    // Username validation
    if (!formData.username) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      valid = false;
    } else if (usernameAvailable === false) {
      newErrors.username = "Username is already taken";
      valid = false;
    } else {
      newErrors.username = "";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    } else {
      newErrors.password = "";
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    } else {
      newErrors.confirmPassword = "";
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleNextStep = () => {
    if (currentStep === "basic" && validateBasicInfo()) {
      setCurrentStep("profile");
    } else if (currentStep === "profile") {
      setCurrentStep("confirmation");
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep === "profile") {
      setCurrentStep("basic");
    } else if (currentStep === "confirmation") {
      setCurrentStep("profile");
    }
  };
  
  const handleSkip = () => {
    // Skip to confirmation if on profile step
    if (currentStep === "profile") {
      setCurrentStep("confirmation");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If on basic info step, validate and move to next step
    if (currentStep === "basic") {
      if (validateBasicInfo()) {
        handleNextStep();
      }
      return;
    }
    
    // If on profile step, just move to next step (all fields optional)
    if (currentStep === "profile") {
      handleNextStep();
      return;
    }
    
    // If on confirmation step, submit the form
    if (currentStep === "confirmation") {
      setIsLoading(true);
      
      try {
        await signUp(formData.email, formData.password, formData.username);
        
        // Navigate to profile setup with additional data if needed
        // In a real app, you'd save the profile data here
        if (profileImage || formData.bio || formData.preferredCurrency || formData.travelPreferences.length > 0) {
          // Save additional profile data
          // This would typically be done in a separate API call after successful signup
          console.log("Additional profile data to be saved:", {
            profileImage,
            bio: formData.bio,
            preferredCurrency: formData.preferredCurrency,
            travelPreferences: formData.travelPreferences
          });
        }
      } catch (error) {
        // Error handling is done in the auth context
        console.error("Signup error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const renderBasicInfoStep = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? "border-red-300" : ""}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            placeholder="johndoe"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            className={`${errors.username ? "border-red-300" : ""} ${
              usernameAvailable === true ? "border-green-300 pr-10" : 
              usernameAvailable === false ? "border-red-300 pr-10" : "pr-10"
            }`}
          />
          {usernameChecking && formData.username.length >= 3 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
          {!usernameChecking && usernameAvailable === true && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="h-4 w-4" />
            </div>
          )}
          {!usernameChecking && usernameAvailable === false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <X className="h-4 w-4" />
            </div>
          )}
        </div>
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        {!errors.username && formData.username.length >= 3 && usernameAvailable === true && (
          <p className="text-green-500 text-xs mt-1">Username is available!</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className={`${errors.password ? "border-red-300" : ""} pr-10`}
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
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        <PasswordStrength password={formData.password} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`${errors.confirmPassword ? "border-red-300" : ""} pr-10`}
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
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      
      <div>
        <Button
          type="button"
          onClick={handleNextStep}
          className="w-full bg-planit-teal hover:bg-planit-teal/90 transition-all"
        >
          Next Step
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  );
  
  const renderProfileStep = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="profilePicture">Profile Picture (optional)</Label>
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400"
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
          <div className="flex-1">
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
              variant="outline"
              className="w-full transition-all hover:bg-gray-50"
              onClick={() => document.getElementById("profilePicture")?.click()}
            >
              {profileImage ? "Change Picture" : "Upload Picture"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Brief Bio (optional)</Label>
        <textarea
          id="bio"
          name="bio"
          placeholder="Tell us a little about yourself..."
          value={formData.bio}
          onChange={handleChange}
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="preferredCurrency">Preferred Currency</Label>
        <select
          id="preferredCurrency"
          name="preferredCurrency"
          value={formData.preferredCurrency}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="CAD">CAD (C$)</option>
          <option value="AUD">AUD (A$)</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <Label>Travel Preferences (optional)</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {["Adventure", "Relaxation", "Culture", "Food", "Nature", "History", "Budget", "Luxury"].map(preference => (
            <button
              key={preference}
              type="button"
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                formData.travelPreferences.includes(preference)
                  ? "bg-planit-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handleTravelPreferenceToggle(preference)}
            >
              {preference}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-3 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevStep}
          className="flex-1 transition-all hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSkip}
          variant="ghost"
          className="flex-1 transition-all hover:bg-gray-50"
        >
          Skip for now
        </Button>
        <Button
          type="button"
          onClick={handleNextStep}
          className="flex-1 bg-planit-teal hover:bg-planit-teal/90 transition-all"
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  );
  
  const renderConfirmationStep = () => (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-24 w-24 rounded-full bg-planit-teal/10 flex items-center justify-center text-planit-teal mb-4">
            <Check className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-planit-navy text-center">
            Ready to Create Your Account
          </h2>
          <p className="text-gray-600 text-center mt-2 max-w-xs">
            You're all set! Click the button below to create your account and start planning your adventures.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Email</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Username</span>
            <span className="font-medium">{formData.username}</span>
          </div>
          {profileImage && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profile Picture</span>
              <div className="h-8 w-8 rounded-full overflow-hidden">
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              </div>
            </div>
          )}
          {formData.preferredCurrency && formData.preferredCurrency !== "USD" && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Currency</span>
              <span className="font-medium">{formData.preferredCurrency}</span>
            </div>
          )}
          {formData.travelPreferences.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Preferences</span>
              <div className="flex flex-wrap justify-end gap-1">
                {formData.travelPreferences.map(pref => (
                  <span key={pref} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            className="flex-1 transition-all hover:bg-gray-50"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-planit-teal hover:bg-planit-teal/90 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : "Create Account"}
          </Button>
        </div>
      </div>
    </>
  );
  
  const getStepContent = () => {
    switch (currentStep) {
      case "basic":
        return renderBasicInfoStep();
      case "profile":
        return renderProfileStep();
      case "confirmation":
        return renderConfirmationStep();
      default:
        return renderBasicInfoStep();
    }
  };
  
  return (
    <AuthLayout 
      title={
        currentStep === "basic" ? "Create your account" :
        currentStep === "profile" ? "Set up your profile" :
        "Confirm your details"
      } 
      description={
        currentStep === "basic" ? "Enter your details to get started" :
        currentStep === "profile" ? "Tell us a little about yourself" :
        "Review your information"
      }
      footer={
        currentStep === "basic" && (
          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-planit-teal font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        )
      }
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep !== "basic" ? "bg-planit-teal text-white" : "bg-planit-teal/10 text-planit-teal"
            }`}>
              {currentStep !== "basic" ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <div className={`h-1 w-12 ${
              currentStep !== "basic" ? "bg-planit-teal" : "bg-gray-200"
            }`}></div>
          </div>
          <div className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep === "profile" ? "bg-planit-teal/10 text-planit-teal" :
              currentStep === "confirmation" ? "bg-planit-teal text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {currentStep === "confirmation" ? <Check className="h-5 w-5" /> : "2"}
            </div>
            <div className={`h-1 w-12 ${
              currentStep === "confirmation" ? "bg-planit-teal" : "bg-gray-200"
            }`}></div>
          </div>
          <div className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep === "confirmation" ? "bg-planit-teal/10 text-planit-teal" : "bg-gray-200 text-gray-500"
            }`}>
              3
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className={currentStep === "basic" ? "text-planit-teal" : "text-gray-500"}>Account</span>
          <span className={currentStep === "profile" ? "text-planit-teal" : "text-gray-500"}>Profile</span>
          <span className={currentStep === "confirmation" ? "text-planit-teal" : "text-gray-500"}>Confirm</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {getStepContent()}
        
        {currentStep === "basic" && (
          <p className="text-xs text-gray-500 text-center mt-6">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-planit-teal hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-planit-teal hover:underline">
              Privacy Policy
            </Link>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default Signup;
