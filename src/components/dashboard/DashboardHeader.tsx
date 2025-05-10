
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function DashboardHeader() {
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-planit-teal flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="ml-2 font-bold text-lg text-planit-navy hidden sm:block">Planit</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 items-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search trips..."
              className="pl-9 w-full bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Mobile Search Toggle */}
        <div className="flex md:hidden flex-1 items-center px-2">
          {showSearch ? (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search trips..."
                className="pl-9 w-full bg-gray-50 border-gray-200"
                autoFocus
                onBlur={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="ml-auto"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex items-center space-x-1">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-planit-coral flex items-center justify-center text-[10px] text-white font-semibold">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="cursor-pointer py-3">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-planit-teal/10 flex items-center justify-center text-planit-teal mr-3 flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New trip invitation</p>
                        <p className="text-xs text-gray-500">
                          Sarah invited you to "European Summer"
                        </p>
                        <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-center text-planit-teal font-medium">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-planit-navy text-white flex items-center justify-center text-sm font-medium">
                  JS
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center gap-2 p-2">
                <div className="h-10 w-10 rounded-full bg-planit-navy text-white flex items-center justify-center text-sm font-medium">
                  JS
                </div>
                <div>
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-gray-500">john@example.com</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
