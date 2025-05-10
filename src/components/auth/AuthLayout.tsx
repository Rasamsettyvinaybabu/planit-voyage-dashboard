
import { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
};

export default function AuthLayout({ children, title, description, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Welcome Animation */}
      <div className="hidden md:flex md:w-1/2 bg-planit-navy p-6 flex-col justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-planit-teal flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="ml-2 text-white font-bold text-2xl">Planit</span>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md aspect-square bg-world-map">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse-slow">
                <div className="h-24 w-24 rounded-full bg-planit-teal/20 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-planit-teal/40 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-planit-teal animate-spin-slow"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-white font-bold text-3xl mt-8 text-center">Start Planning Adventures Together</h2>
          <p className="text-white/70 mt-4 text-center max-w-md">
            Join thousands of travelers planning memorable adventures around the world with friends and family.
          </p>
        </div>

        <div className="text-white/50 text-sm text-center py-4">
          © {new Date().getFullYear()} Planit. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col p-6 md:p-12 bg-planit-white">
        <div className="md:hidden flex items-center mb-8">
          <Link to="/" className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-planit-teal flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="ml-2 text-planit-navy font-bold text-xl">Planit</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-planit-navy">{title}</h1>
          <p className="mt-2 text-gray-600">{description}</p>
          
          <div className="mt-8">
            {children}
          </div>
        </div>

        {footer && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
