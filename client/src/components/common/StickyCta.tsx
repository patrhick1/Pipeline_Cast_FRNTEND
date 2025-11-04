import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import siteData from "@/data/site.json";

export default function StickyCta() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Pages where we don't want to show the sticky CTA
  const hiddenPages = ["/billing/success", "/login", "/signup"];
  const shouldHide = hiddenPages.some((page) => location.startsWith(page));

  // Show CTA after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (shouldHide) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <a
        href={siteData.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all px-6 py-6 rounded-2xl"
        >
          <Phone className="mr-2 h-5 w-5" />
          Book Free Call
        </Button>
      </a>
    </div>
  );
}
