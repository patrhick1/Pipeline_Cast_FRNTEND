import { Link } from "wouter";
import logoWordmark from "@/img/pipeline icon and wordmark.png";
import siteData from "@/data/site.json";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="py-12 bg-navy-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          {/* Logo */}
          <div>
            <img
              src={logoWordmark}
              alt="PipelineCast"
              className="h-10 brightness-0 invert"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a
              href="#process"
              onClick={(e) => scrollToSection(e, "process")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#qualification"
              onClick={(e) => scrollToSection(e, "qualification")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Is This For Me?
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, "faq")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </a>
            <a
              href={siteData.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal-400 transition-colors"
            >
              Book a Call
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {currentYear} PipelineCast. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy">
                <a className="hover:text-white transition-colors">Privacy</a>
              </Link>
              <Link href="/terms">
                <a className="hover:text-white transition-colors">Terms</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
