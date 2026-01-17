// Layout components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Home page sections (in order)
import HeroCfo from "@/components/home/HeroCfo";
import ProblemSection from "@/components/home/ProblemSection";
import SolutionProcess from "@/components/home/SolutionProcess";
import TheMath from "@/components/home/TheMath";
import QualificationSection from "@/components/home/QualificationSection";
import FaqCfo from "@/components/home/FaqCfo";
import FinalCta from "@/components/home/FinalCta";

export default function Home() {
  return (
    <div className="min-h-screen bg-off-white">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <HeroCfo />

      {/* Problem Section (Dark Background) */}
      <ProblemSection />

      {/* Solution/Process Section */}
      <SolutionProcess />

      {/* The Math Section */}
      <TheMath />

      {/* Qualification Section */}
      <QualificationSection />

      {/* FAQ Section */}
      <FaqCfo />

      {/* Final CTA Section */}
      <FinalCta />

      {/* Footer */}
      <Footer />
    </div>
  );
}
