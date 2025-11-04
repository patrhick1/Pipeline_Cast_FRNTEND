import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCta from "@/components/common/StickyCta";

// Import case studies
import caseStudy1 from "@/data/case-studies/saas-growth-co.json";
import caseStudy2 from "@/data/case-studies/techventures-inc.json";
import caseStudy3 from "@/data/case-studies/leadership-insights.json";

const caseStudies = [caseStudy1, caseStudy2, caseStudy3];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {/* Sticky CTA */}
      <StickyCta />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Real Results from Real Clients
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how entrepreneurs and thought leaders are growing their influence through our DFY podcast booking service
          </p>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.map((study) => (
              <Card key={study.slug} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <Link href={`/case-studies/${study.slug}`}>
                  <a className="block">
                    {/* Image */}
                    <div className="relative h-64 bg-gray-100">
                      <img
                        src={study.testimonialImage}
                        alt={`${study.client.company} case study`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {study.tags[0]}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Client Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-lg">
                            {study.client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{study.client.name}</p>
                          <p className="text-sm text-gray-600">{study.client.company}</p>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {study.title}
                      </h3>

                      {/* Key Metric */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <p className="text-green-800 font-semibold">
                            {study.metrics.bookings} bookings in {Math.ceil(study.metrics.timeframeWeeks / 4)} months
                          </p>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {study.challenge}
                      </p>

                      {/* CTA */}
                      <div className="flex items-center text-indigo-600 font-semibold group">
                        Read Full Story
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </a>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want Results Like These?
          </h2>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
            Book a free strategy call to see how we can help you get booked on quality podcasts
          </p>
          <Link href="/bookings">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
              View Pricing & Book Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
