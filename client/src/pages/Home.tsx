import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import siteData from "@/data/site.json";

// Import new components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCta from "@/components/common/StickyCta";
import PainSolutionGrid from "@/components/home/PainSolutionGrid";
import ProcessSteps from "@/components/home/ProcessSteps";
import GuaranteeBand from "@/components/home/GuaranteeBand";
import PricingTeaser from "@/components/home/PricingTeaser";
import TrustStrip from "@/components/home/TrustStrip";
import Faq from "@/components/common/Faq";

// Import testimonial images directly
import testimonial1 from "@/PGL Assets/Client Case Studies/Website (1000x800)/1.png";
import testimonial2 from "@/PGL Assets/Client Case Studies/Website (1000x800)/2.png";
import testimonial3 from "@/PGL Assets/Client Case Studies/Website (1000x800)/3.png";
import testimonial4 from "@/PGL Assets/Client Case Studies/Website (1000x800)/4.png";
import testimonial5 from "@/PGL Assets/Client Case Studies/Website (1000x800)/5.png";
import testimonial6 from "@/PGL Assets/Client Case Studies/Website (1000x800)/6.png";

export default function Home() {
  const testimonialRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Array of testimonial images to display
  const testimonialImages = [
    testimonial1,
    testimonial2,
    testimonial3,
    testimonial4,
    testimonial5,
    testimonial6
  ];

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialRef.current) {
      const scrollAmount = 400;
      const currentScroll = testimonialRef.current.scrollLeft;
      const targetScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      testimonialRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const checkScrollButtons = () => {
    if (testimonialRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = testimonialRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {/* Sticky CTA */}
      <StickyCta />

      {/* Hero Section - Updated with DFY messaging */}
      <section className="pt-24 pb-20 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Scale Podcast Guest Appearances Without the Grind
            </h1>
            <p className="text-lg md:text-xl mb-6 text-indigo-100 max-w-2xl mx-auto">
              We create a media kit that sells you, then research, pitch, and book shows where your ICP is already listening.
            </p>
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-10">
              <p className="text-sm font-medium">
                ✓ Average {(siteData.metrics.avgPlacementRate * 100).toFixed(1)}% pitch→placement rate
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Book Free Strategy Call
                </Button>
              </a>
              <Link href="/bookings">
                <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg">
                  See Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Pain vs Solution Grid */}
      <PainSolutionGrid />

      {/* 3-Step Process */}
      <ProcessSteps />

      {/* Guarantee Band */}
      <GuaranteeBand />

      {/* Social Proof / Testimonials - Now using data */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Results from Our Clients
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join entrepreneurs and thought leaders who are growing their influence through strategic podcast appearances
            </p>
          </div>

          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => scrollTestimonials('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg transition-all ${
                canScrollLeft
                  ? 'opacity-100 hover:scale-110 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>

            <button
              onClick={() => scrollTestimonials('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg transition-all ${
                canScrollRight
                  ? 'opacity-100 hover:scale-110 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>

            {/* Testimonial Carousel */}
            <div
              ref={testimonialRef}
              onScroll={checkScrollButtons}
              className="overflow-x-auto scrollbar-hide scroll-smooth"
            >
              <div className="flex gap-6 px-12">
                {testimonialImages.map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[500px] h-[400px] relative group"
                  >
                    <img
                      src={image}
                      alt={`Client testimonial ${index + 1}`}
                      className="w-full h-full object-contain rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonialImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (testimonialRef.current) {
                      const scrollPosition = index * 530;
                      testimonialRef.current.scrollTo({
                        left: scrollPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="w-2 h-2 rounded-full bg-gray-300 hover:bg-indigo-600 transition-colors"
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/case-studies">
                <Button variant="outline" className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                  View All Case Studies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <PricingTeaser />

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our DFY service
            </p>
          </div>

          <Faq items={siteData.faq} />

          <div className="text-center mt-10">
            <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6">
                Book Your Strategy Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Booked on {siteData.pricing.dfy.placements} Quality Podcasts?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            ${siteData.pricing.dfy.price.toLocaleString()} for {siteData.pricing.dfy.placements} guaranteed placements in {siteData.pricing.dfy.duration} — or your money back.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={siteData.bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-8 py-6 text-lg">
                Book Free Strategy Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Link href="/bookings">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg">
                View Full Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
