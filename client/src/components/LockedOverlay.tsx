// client/src/components/LockedOverlay.tsx
import { Lock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface LockedOverlayProps {
  message?: string;
  compact?: boolean;
}

export function LockedOverlay({
  message = "Upgrade to unlock this feature",
  compact = false
}: LockedOverlayProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation('/pricing');
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-40 cursor-pointer group transition-all hover:bg-white/98"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-white/95 via-indigo-50/95 to-purple-50/95 backdrop-blur-sm flex items-center justify-center z-40 cursor-pointer group transition-all"
    >
      <div className="max-w-md mx-auto text-center px-6 py-8">
        {/* Lock Icon with Gradient Background */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-6 group-hover:scale-110 transition-transform">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Message */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Upgrade Button */}
        <Button
          onClick={handleClick}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-shadow"
        >
          Upgrade to Access
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Feature Preview Text */}
        <p className="mt-6 text-xs text-gray-500">
          You're viewing a preview. Upgrade to interact with this feature.
        </p>
      </div>
    </div>
  );
}
