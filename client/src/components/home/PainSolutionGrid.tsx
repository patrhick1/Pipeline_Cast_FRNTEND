import { Card } from "@/components/ui/card";
import { X, CheckCircle, Clock, Mail, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PainSolutionGrid() {
  const painPoints = [
    {
      icon: Clock,
      text: "Researching hundreds of shows takes weeks"
    },
    {
      icon: Mail,
      text: "Crafting pitches that get ignored"
    },
    {
      icon: Search,
      text: "Following up endlessly with no response"
    },
    {
      icon: Target,
      text: "Coordinating scheduling across time zones"
    },
    {
      icon: X,
      text: "Wondering if your pitch was good enough"
    }
  ];

  const solutions = [
    {
      icon: CheckCircle,
      text: "Professional media kit that sells you"
    },
    {
      icon: CheckCircle,
      text: "We handle all research & qualification"
    },
    {
      icon: CheckCircle,
      text: "Proven pitch templates with 17.5% success rate"
    },
    {
      icon: CheckCircle,
      text: "We manage all follow-ups & coordination"
    },
    {
      icon: CheckCircle,
      text: "You just show up prepared and confident"
    },
    {
      icon: CheckCircle,
      text: "Guaranteed 5 bookings or money back"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stop Struggling With Do-It-Yourself Outreach
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let us handle the tedious work while you focus on delivering value
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Pain Column */}
          <Card className="p-8 border-2 border-red-100 bg-red-50/30">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <X className="h-5 w-5 text-red-600" />
              </span>
              Do-It-Yourself Podcast Outreach
            </h3>
            <ul className="space-y-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <li key={index} className="flex items-start">
                    <Icon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{point.text}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Solution Column */}
          <Card className="p-8 border-2 border-green-200 bg-green-50/30">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </span>
              PGL Done-For-You
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <li key={index} className="flex items-start">
                    <Icon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{solution.text}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="text-center mt-10">
          <a href="#how-it-works" className="inline-block">
            <Button size="lg" variant="outline" className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
              See How the Process Works
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
