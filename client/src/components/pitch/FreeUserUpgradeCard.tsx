import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Brain, Mail, TrendingUp, CheckCircle } from 'lucide-react';

interface FreeUserUpgradeCardProps {
  variant?: 'compact' | 'detailed';
  context?: 'table' | 'banner' | 'modal';
}

export function FreeUserUpgradeCard({ variant = 'detailed', context = 'banner' }: FreeUserUpgradeCardProps) {
  const handleUpgrade = () => {
    window.open('https://calendly.com/alex-podcastguestlaunch/30min', '_blank');
  };

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Unlock AI-Powered Pitching</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Get personalized AI pitches, automatic follow-ups, and Smart Send™
                </p>
              </div>
            </div>
            <Button 
              onClick={handleUpgrade}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
            >
              Book Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Supercharge Your Outreach with Premium
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Limited Time Offer
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          While templates are great for getting started, Premium unlocks the full power of AI-driven personalization
          that dramatically increases your response rates.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-xs text-gray-900">AI-Personalized Pitches</h5>
              <p className="text-xs text-gray-600">
                Each pitch uniquely crafted based on podcast content & host style
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-xs text-gray-900">Automatic Follow-ups</h5>
              <p className="text-xs text-gray-600">
                AI generates intelligent follow-ups that adapt to each conversation
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-xs text-gray-900">Smart Send™ Technology</h5>
              <p className="text-xs text-gray-600">
                Optimal timing & sequencing to maximize open rates
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-xs text-gray-900">5x Higher Response Rate</h5>
              <p className="text-xs text-gray-600">
                Premium users see dramatically better engagement
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-sm text-purple-900">What You'll Get:</span>
          </div>
          <ul className="space-y-1 text-xs text-purple-700">
            <li>• Unlimited AI-powered pitch generation</li>
            <li>• Intelligent follow-up sequences (up to 5 touchpoints)</li>
            <li>• Smart Send with optimal timing algorithms</li>
            <li>• Advanced analytics & response tracking</li>
            <li>• Priority support & onboarding assistance</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-gray-500">Currently using: <strong>Free Plan</strong></p>
            <p className="text-xs text-gray-500">Templates only • Manual editing required</p>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Book Demo to Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}