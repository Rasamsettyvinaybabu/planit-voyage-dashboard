
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useParams } from "react-router-dom";
import ActivitiesTab from "./ActivitiesTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ActivityList = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [currentView, setCurrentView] = useState<"list" | "calendar" | "map">("list");

  return (
    <div>
      <div className="mb-4">
        <Tabs
          value={currentView}
          onValueChange={(value: any) => setCurrentView(value)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4">
        {currentView === "list" && <ActivitiesTab />}
        
        {currentView === "calendar" && (
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-center py-16 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-600">Calendar View Coming Soon</h3>
              <p className="text-gray-500 mt-2">
                We're working on a calendar view to help you visualize your itinerary.
              </p>
            </div>
          </div>
        )}
        
        {currentView === "map" && (
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-center py-16 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-600">Map View Coming Soon</h3>
              <p className="text-gray-500 mt-2">
                We're working on a map view to help you visualize your activities geographically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityList;
