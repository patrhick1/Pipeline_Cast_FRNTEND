import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Shield, ArrowRight } from "lucide-react";
import siteData from "@/data/site.json";

export default function PricingTable() {
  const { dfy, monthly } = siteData.pricing;

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Main DFY Offer - Prominent */}
      <Card className="p-8 border-2 border-indigo-300 shadow-2xl relative md:col-span-2 lg:col-span-1 lg:scale-105">
        {/* Recommended Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            ⭐ Recommended
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{dfy.name}</h3>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-5xl font-bold text-indigo-600">
              ${dfy.price.toLocaleString()}
            </span>
          </div>
          <p className="text-xl text-gray-600">
            {dfy.placements} Guaranteed Placements in {dfy.duration}
          </p>
        </div>

        {/* Guarantee Badge */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-600 flex-shrink-0" />
          <p className="text-sm text-gray-700 font-medium">
            Money-back guarantee: If you don't get 5 bookings in 5 months, we keep working free or refund you
          </p>
        </div>

        {/* Inclusions */}
        <div className="space-y-3 mb-8">
          <p className="font-semibold text-gray-900 mb-4">What's Included:</p>
          {dfy.inclusions.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg">
            Book Free Strategy Call
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </a>

        <p className="text-center text-sm text-gray-500 mt-4">
          No credit card required • 15-minute call
        </p>
      </Card>

      {/* Secondary - Monthly Plans */}
      <Card className="p-8 border-2 border-gray-200 bg-gray-50/50">
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{monthly.name}</h3>
          <p className="text-lg text-gray-600">{monthly.description}</p>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-gray-700 mb-4">
            Perfect for:
          </p>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Ongoing podcast booking needs</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Consistent weekly guest appearances</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Custom targeting and niche focus</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Flexible month-to-month commitment</span>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-center text-gray-700 font-medium">
            Custom pricing based on your goals and volume
          </p>
        </div>

        <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="lg" variant="outline" className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 py-6 text-lg">
            Schedule a Consultation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </a>

        <p className="text-center text-sm text-gray-500 mt-4">
          We'll create a custom plan for your needs
        </p>
      </Card>
    </div>
  );
}
