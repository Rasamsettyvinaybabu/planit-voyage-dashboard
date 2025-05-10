
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  
  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError("");
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        await resetPassword(email);
        setIsSubmitted(true);
      } catch (error) {
        // Error handling is done in the auth context
        console.error("Password reset error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <AuthLayout
      title="Reset your password"
      description={
        isSubmitted
          ? "Check your email for a reset link"
          : "Enter your email to receive a password reset link"
      }
      footer={
        <p className="text-center text-gray-600">
          Remember your password?{" "}
          <Link to="/login" className="text-planit-teal font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {isSubmitted ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-planit-teal/10 flex items-center justify-center text-planit-teal mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-planit-navy text-center">
              Check your inbox
            </h2>
            <p className="text-gray-600 text-center mt-2">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <Button
            className="w-full bg-planit-teal hover:bg-planit-teal/90 transition-colors"
            onClick={() => setIsSubmitted(false)}
          >
            Send another email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={error ? "border-red-300" : ""}
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          
          <div>
            <Button
              type="submit"
              className="w-full bg-planit-teal hover:bg-planit-teal/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : "Send reset link"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
