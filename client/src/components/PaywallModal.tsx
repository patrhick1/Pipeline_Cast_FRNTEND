// client/src/components/PaywallModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Crown, ArrowRight, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

export function PaywallModal({ isOpen, onClose, featureName, featureDescription }: PaywallModalProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onClose();
    setLocation('/pricing');
  };

  const features = [
    'AI-powered podcast matching',
    'Unlimited pitch generations',
    'Email automation & sequences',
    'Campaign tracking & analytics',
    'Priority support',
    'Professional media kit customization'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-navy to-teal rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-r from-navy to-teal rounded-full p-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {featureDescription || `${featureName} is a premium feature available on our paid plans.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature Highlights */}
          <div className="bg-gradient-to-br from-navy-50 to-teal-50 rounded-lg p-4 border border-navy-100">
            <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-teal" />
              What you'll get with a paid plan:
            </h3>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Options Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3 hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-teal" />
                <Badge variant="secondary" className="text-xs">Most Popular</Badge>
              </div>
              <h4 className="font-semibold text-sm mb-1">Self-Service</h4>
              <p className="text-xs text-gray-600">Manage your own outreach with full platform access</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 hover:border-gold-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-gold" />
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
              <h4 className="font-semibold text-sm mb-1">Done-For-You</h4>
              <p className="text-xs text-gray-600">Our team handles everything for you</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-navy to-teal hover:from-navy-700 hover:to-teal-700 text-white"
              size="lg"
            >
              View Pricing Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              3-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
