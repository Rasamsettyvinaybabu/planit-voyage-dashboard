
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TripCreationWizard from "@/components/trips/TripCreationWizard";

const TripCreation = () => {
  const navigate = useNavigate();

  // Check user authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login', { state: { redirect: '/trips/create' } });
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      
      <main className="flex-1 py-8">
        <div className="container px-4 sm:px-6">
          <TripCreationWizard />
        </div>
      </main>
    </div>
  );
};

export default TripCreation;
