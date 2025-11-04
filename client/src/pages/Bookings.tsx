import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCta from "@/components/common/StickyCta";
import PricingTable from "@/components/pricing/PricingTable";
import BookingWidget from "@/components/common/BookingWidget";
import Faq from "@/components/common/Faq";
import siteData from "@/data/site.json";
import { Link } from "wouter";

export default function Bookings() {
  const pricingFaq = [
    {
      question: "How is this different from your self-service platform?",
      answer: "Our DFY service means we do all the work for you—research, pitching, follow-ups, and booking coordination. You simply approve the podcast matches we present. It's completely hands-off for you."
    },
    {
      question: "Can I choose which podcasts to target?",
      answer: "Absolutely! We present vetted podcast matches based on your ICP and goals. You review and approve which shows we pitch to. You have full control over where you appear."
    },
    {
      question: "What happens after I get 5 bookings?",
      answer: "After your 5 guaranteed bookings, you can choose to continue with a monthly plan, purchase another package, or stop the service. Many clients continue because they see the value of consistent podcast appearances."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes! If we don't deliver 5 confirmed bookings within 5 months, we'll either keep working at no extra charge until you reach 5, or provide a full refund. No questions asked."
    },
    {
      question: "How do you measure success?",
      answer: "Success is measured by confirmed podcast bookings—where you receive a confirmed date and time to record. We track every pitch, response, and booking in your dashboard."
    }
  ];

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
            Performance-Based Podcast Booking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Pay for results, not promises. Get booked or get your money back.
          </p>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Money-Back Guarantee</span>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingTable />
        </div>
      </section>

      {/* How Billing Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Billing Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple, transparent process from start to finish
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Book Strategy Call",
                description: "Schedule a free 15-minute call to discuss your goals, ICP, and ideal podcast targets."
              },
              {
                step: 2,
                title: "Pay Upfront (If We're a Fit)",
                description: "After the call, if we're confident we can help, you pay $1,000 upfront to get started."
              },
              {
                step: 3,
                title: "We Start Research & Outreach",
                description: "Our team immediately begins researching podcasts, crafting personalized pitches, and managing all communication."
              },
              {
                step: 4,
                title: "Receive 5 Confirmed Bookings",
                description: "You'll get 5 confirmed podcast bookings within 5 months. We coordinate all scheduling and prep materials."
              },
              {
                step: 5,
                title: "Money-Back Guarantee",
                description: "If we don't deliver 5 bookings within 5 months, we keep working free until you reach 5—or you get your money back. No questions asked."
              }
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-lg border-2 border-gray-200 p-6 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              DIY vs. Done-For-You
            </h2>
            <p className="text-lg text-gray-600">
              See why clients choose our DFY service
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-900 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-600 font-semibold">DIY Approach</th>
                  <th className="text-center py-4 px-4 text-indigo-600 font-semibold bg-indigo-50">PGL DFY Service</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Time Investment", diy: "20+ hours/week", pgl: "10 min/week" },
                  { feature: "Success Rate", diy: "2-5% typical", pgl: "17.5% guaranteed" },
                  { feature: "Pitches Written", diy: "You handle all", pgl: "We handle all" },
                  { feature: "Follow-ups", diy: "You track", pgl: "We track" },
                  { feature: "Bookings", diy: "Hope for best", pgl: "5 guaranteed" },
                  { feature: "Cost", diy: "Your time", pgl: "$1,000" }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.diy}</td>
                    <td className="py-4 px-4 text-center font-medium text-indigo-600 bg-indigo-50">{row.pgl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Booking Widget */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Book Your Free Strategy Call
            </h2>
            <p className="text-lg text-gray-600">
              15 minutes to discuss your goals and see if we're a fit
            </p>
          </div>

          <BookingWidget />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pricing Questions
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about our DFY service
            </p>
          </div>

          <Faq items={pricingFaq} />
        </div>
      </section>

      {/* Social Proof Mini */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 mb-4">
            Don't just take our word for it
          </p>
          <Link href="/case-studies">
            <Button variant="outline" className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
              View Client Success Stories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Launch Your Podcast Guest Career?
          </h2>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
            Join entrepreneurs and thought leaders who use PGL to get booked on top podcasts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
                Book Free Strategy Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="mailto:hello@podcastguestlaunch.com">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
