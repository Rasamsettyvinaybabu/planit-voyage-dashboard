
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const Loader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center", className)}
    {...props}
  >
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
));

Loader.displayName = "Loader";

export { Loader };
