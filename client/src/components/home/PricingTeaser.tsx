import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DollarSign, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import siteData from "@/data/site.json";

export default function PricingTeaser() {
  const { dfy } = siteData.pricing;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No hidden fees. No surprises. Just results.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 border-2 border-indigo-200 shadow-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
                <DollarSign className="h-8 w-8 text-indigo-600" />
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ${dfy.price.toLocaleString()} for {dfy.placements} Guaranteed Placements
              </h3>

              <p className="text-xl text-gray-600 mb-6">
                in {dfy.duration} or your money back
              </p>

              <div className="bg-indigo-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <p className="text-gray-700 font-medium mb-4">What's Included:</p>
                <ul className="grid md:grid-cols-2 gap-3 text-left text-sm text-gray-600">
                  {dfy.inclusions.slice(0, 4).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-600 mr-2">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/bookings">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg">
                    View Full Details
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                Prefer a consistent weekly cadence?{" "}
                <Link href="/contact">
                  <a className="text-indigo-600 hover:text-indigo-700 underline">
                    Ask about our monthly plans
                  </a>
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
