// client/src/components/UpgradeBanner.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles, Crown } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradeBannerProps {
  featureName: string;
  featureDescription: string;
}

export function UpgradeBanner({ featureName, featureDescription }: UpgradeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [, setLocation] = useLocation();

  const handleClose = () => {
    setIsVisible(false);
    // Redirect to dashboard after a brief delay for animation
    setTimeout(() => {
      setLocation('/');
    }, 200);
  };

  const handleUpgrade = () => {
    setLocation('/pricing');
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Feature info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Unlock {featureName}</h3>
                  <Crown className="w-5 h-5 text-yellow-300" />
                </div>
                <p className="text-sm text-indigo-100">{featureDescription}</p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUpgrade}
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold shadow-lg hidden sm:flex"
              >
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold shadow-lg sm:hidden"
              >
                Upgrade
              </Button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient border at bottom */}
      <div className="h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
    </div>
  );
}
