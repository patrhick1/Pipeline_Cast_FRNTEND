import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarPlus, Mic, AlertTriangle, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoWordmark from "@/img/pipeline icon and wordmark.png";

const pageInfo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Dashboard",
    description: "Welcome back! Here's your pipeline performance overview.",
  },
  "/discover": {
    title: "Discover Podcasts",
    description: "Find and connect with podcasts that match your expertise.",
  },
  "/questionnaire": {
    title: "Questionnaire",
    description: "Complete your profile to get better podcast matches.",
  },
  "/media-kit": {
    title: "Media Kit",
    description: "Create and manage your professional media kit.",
  },
  "/angle-generator": {
    title: "Angle Generator",
    description: "Generate compelling pitch angles for podcast hosts.",
  },
  "/approvals": {
    title: "Approvals",
    description: "Track the status of your podcast applications.",
  },
  "/tracking": {
    title: "Placement Tracking",
    description: "Monitor your podcast appearances and performance.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your account and preferences.",
  },
};

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const currentPage = pageInfo[location] || {
    title: "PipelineCast",
    description: "Podcast-to-Pipeline Performance Portal"
  };

  const handleBookDemo = () => {
    window.open("https://calendly.com/paschal-pipelinecast/30min", "_blank");
  };


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1 pl-14 lg:pl-0">
            {/* Responsive Logo: Text with mic icon on mobile, image on desktop */}
            <div className="flex items-center flex-shrink-0">
              {/* Mobile Logo (text) */}
              <div className="flex items-center sm:hidden">
                <span className="text-lg font-bold text-navy">Pipeline</span>
                <span className="text-lg font-semibold text-teal ml-0.5">Cast</span>
              </div>
              {/* Desktop Logo (original image) */}
              <img src={logoWordmark} alt="PipelineCast" className="h-8 hidden sm:block" />
            </div>
            <div className="ml-3 sm:ml-6 min-w-0">
              <h2 className="text-base sm:text-xl font-semibold text-gray-700 truncate">{currentPage.title}</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">{currentPage.description}</p>
            </div>
          </div>
          <div className="flex items-center ml-3 space-x-2 sm:space-x-4 flex-shrink-0">
            <Button 
              className="bg-primary text-white hover:bg-black-700 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
              onClick={handleBookDemo}
            >
              <CalendarPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Book Demo</span>
              <span className="sm:hidden">Book</span>
            </Button>
            {/* Status indicators */}
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                {user?.show_verification_banner && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Verify Email</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Please verify your email address</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Only show setup badge for client users, not admin/staff */}
                {user?.show_onboarding_button && user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'staff' && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        <ClipboardList className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Setup</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Complete your profile setup</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
              
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage 
                  src={user?.profile_image_url ? `${user.profile_image_url}?t=${Date.now()}` : undefined} 
                  alt={user?.full_name || user?.username || "User"}
                />
                <AvatarFallback className="bg-gray-300 text-gray-700 text-xs sm:text-sm">
                  {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
