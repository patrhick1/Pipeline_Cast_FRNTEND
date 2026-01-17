import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import siteData from "@/data/site.json";
import heroImage from "@/img/pipeline hero.png";

export default function HeroCfo() {
  const scrollToProcess = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("process");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="pt-32 pb-24 bg-off-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            {/* Eyebrow */}
            <p className="text-sm font-medium uppercase tracking-wider text-teal mb-6">
              Podcast-to-Pipeline for Fractional CFOs
            </p>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-navy leading-tight mb-6 tracking-tight">
              Stop hoping podcasts might work.
              <br />
              Start knowing they will.
            </h1>

            {/* Subhead */}
            <p className="text-lg md:text-xl text-cool-gray leading-relaxed mb-10 max-w-2xl">
              We turn podcast appearances into qualified sales conversations for
              fractional CFOs, with a system you approve, control, and measure.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <a
                href={siteData.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-teal hover:bg-teal-600 text-navy font-semibold px-8 py-6 text-base"
                >
                  Book Discovery Call
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a
                href="#process"
                onClick={scrollToProcess}
                className="text-navy font-medium hover:text-teal transition-colors py-3 px-2"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="hidden lg:flex justify-center items-center">
            <img
              src={heroImage}
              alt="PipelineCast - Podcast to Pipeline"
              className="w-full max-w-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
