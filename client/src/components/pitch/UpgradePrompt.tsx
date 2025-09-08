import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface UpgradePromptProps {
  message?: string;
  features?: string[];
  onUpgrade?: () => void;
  variant?: 'inline' | 'banner' | 'modal';
}

export function UpgradePrompt({ 
  message = 'Upgrade to Premium for advanced features',
  features = [],
  onUpgrade,
  variant = 'banner'
}: UpgradePromptProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation('/pricing');
    }
  };

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 my-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Premium Feature</h4>
              <Badge variant="secondary" className="text-xs">Upgrade Required</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">{message}</p>
            {features.length > 0 && (
              <ul className="space-y-1 mb-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Book Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-6 w-6" />
            Unlock Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{message}</p>
          {features.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          )}
          <Button 
            onClick={handleUpgrade}
            variant="secondary"
            className="bg-white text-purple-700 hover:bg-gray-100"
          >
            Upgrade to Premium
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Modal variant (for future use)
  return null;
}