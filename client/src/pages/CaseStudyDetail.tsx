import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle, TrendingUp, Clock, DollarSign } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCta from "@/components/common/StickyCta";
import siteData from "@/data/site.json";

// Import case studies
import caseStudy1 from "@/data/case-studies/saas-growth-co.json";
import caseStudy2 from "@/data/case-studies/techventures-inc.json";
import caseStudy3 from "@/data/case-studies/leadership-insights.json";

const caseStudies = [caseStudy1, caseStudy2, caseStudy3];

export default function CaseStudyDetail() {
  const [, params] = useRoute("/case-studies/:slug");
  const slug = params?.slug;

  // Find the case study by slug
  const caseStudy = caseStudies.find(cs => cs.slug === slug);

  // If not found, show 404
  if (!caseStudy) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Case Study Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find that case study.
          </p>
          <Link href="/case-studies">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case Studies
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Get related case studies (other studies)
  const relatedStudies = caseStudies.filter(cs => cs.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {/* Sticky CTA */}
      <StickyCta />

      {/* Breadcrumb */}
      <section className="pt-24 pb-6 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/case-studies">
            <a className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to All Case Studies
            </a>
          </Link>
        </div>
      </section>

      {/* Header Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Client Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-2xl">
                {caseStudy.client.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{caseStudy.client.name}</h2>
              <p className="text-gray-600">{caseStudy.client.role} at {caseStudy.client.company}</p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {caseStudy.title}
          </h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {caseStudy.metrics.bookings}
              </div>
              <div className="text-sm text-gray-600">Bookings</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {Math.ceil(caseStudy.metrics.timeframeWeeks / 4)}
              </div>
              <div className="text-sm text-gray-600">Months</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {Math.round(caseStudy.metrics.responseRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {caseStudy.metrics.pitchesSent}
              </div>
              <div className="text-sm text-gray-600">Pitches Sent</div>
            </Card>
          </div>

          {/* Testimonial Image */}
          <div className="mb-8">
            <img
              src={caseStudy.testimonialImage}
              alt={`${caseStudy.client.company} testimonial`}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Challenge */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {caseStudy.challenge}
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 border-2 border-red-100 bg-red-50/30">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{caseStudy.before.title}</h3>
              <ul className="space-y-3">
                {caseStudy.before.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 border-2 border-green-200 bg-green-50/30">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{caseStudy.after.title}</h3>
              <ul className="space-y-3">
                {caseStudy.after.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Solution */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Solution</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {caseStudy.solution}
            </p>
          </div>

          {/* Results */}
          <div className="mb-12 bg-indigo-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The Results</h2>
            <div className="space-y-3">
              {caseStudy.results.map((result, index) => (
                <div key={index} className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-lg text-gray-700">{result}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Highlights */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Highlights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {caseStudy.highlights.map((highlight, index) => (
                <Card key={index} className="p-4 border-l-4 border-indigo-600">
                  <p className="text-gray-700">{highlight}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            {caseStudy.quotes.map((quote, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <blockquote className="text-xl text-gray-700 italic mb-4">
                  "{quote.text}"
                </blockquote>
                <p className="text-gray-600 font-semibold">— {quote.attribution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Case Studies */}
      {relatedStudies.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Success Stories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedStudies.map((study) => (
                <Card key={study.slug} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/case-studies/${study.slug}`}>
                    <a className="block">
                      <div className="h-48 bg-gray-100">
                        <img
                          src={study.testimonialImage}
                          alt={study.client.company}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{study.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{study.client.company}</p>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm">
                          Read Case Study
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </a>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready for Similar Results?
          </h2>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
            Book a free strategy call to see how we can help you get booked on quality podcasts
          </p>
          <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
              Book Free Strategy Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
