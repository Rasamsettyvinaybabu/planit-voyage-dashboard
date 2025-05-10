
import { useState } from "react";
import { Link } from "react-router-dom";

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  setTimeout(() => {
    setIsLoading(false);
  }, 1500);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-planit-white bg-travel-pattern overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-planit-teal/5 to-transparent pointer-events-none"></div>
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center animate-pulse-slow">
          <div className="h-20 w-20 rounded-full bg-planit-teal flex items-center justify-center text-white text-3xl font-bold">
            P
          </div>
          <p className="mt-4 text-planit-navy text-xl font-medium">Loading your adventure...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center animate-fade-in p-6 max-w-4xl w-full">
          <div className="h-24 w-24 rounded-full bg-planit-teal flex items-center justify-center text-white text-4xl font-bold mb-6">
            P
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-planit-navy text-center">
            Welcome to Planit
          </h1>
          <p className="text-xl text-gray-600 mt-4 text-center max-w-xl">
            Plan memorable trips with friends and family. Create itineraries, share expenses, and make memories together.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="btn-primary min-w-[180px] flex items-center justify-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn-secondary min-w-[180px] flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-planit-teal/10 flex items-center justify-center text-planit-teal mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-planit-navy">Collaborate</h3>
              <p className="text-gray-600 mt-2">Plan trips together with friends and family in real-time.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-planit-coral/10 flex items-center justify-center text-planit-coral mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-planit-navy">Organize</h3>
              <p className="text-gray-600 mt-2">Keep all your travel plans in one place with smart organization.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-planit-yellow/10 flex items-center justify-center text-planit-yellow mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-planit-navy">Discover</h3>
              <p className="text-gray-600 mt-2">Find new destinations and get inspired for your next adventure.</p>
            </div>
          </div>
          
          <p className="text-center text-gray-500 mt-16">
            © {new Date().getFullYear()} Planit. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};

export default Welcome;
