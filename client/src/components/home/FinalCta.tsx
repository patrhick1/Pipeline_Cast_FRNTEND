import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import siteData from "@/data/site.json";

export default function FinalCta() {
  return (
    <section className="py-24 bg-navy relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-teal/5 via-transparent to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">
          Ready to build pipeline you control?
        </h2>

        {/* Subhead */}
        <p className="text-lg text-gray-300 leading-relaxed mb-10 max-w-2xl mx-auto">
          Book a 30-minute discovery call. We'll assess fit, walk through the
          system, and give you an honest take on whether this makes sense for
          your practice. No pitch deck. No pressure.
        </p>

        {/* CTA Button */}
        <a
          href={siteData.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="lg"
            className="bg-teal hover:bg-teal-400 text-navy font-bold px-12 py-7 text-lg shadow-lg shadow-teal/25 hover:shadow-xl hover:shadow-teal/30 transition-all"
          >
            Book Discovery Call
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </a>
      </div>
    </section>
  );
}
