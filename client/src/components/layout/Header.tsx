import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import logoWordmark from "@/img/pipeline icon and wordmark.png";
import siteData from "@/data/site.json";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if About page should be shown (from env variable)
  const showAbout = import.meta.env.VITE_SHOW_ABOUT === 'true';
  const showCaseStudies = import.meta.env.VITE_SHOW_CASE_STUDIES === 'true';
  const showBlog = import.meta.env.VITE_SHOW_BLOG === 'true';

  const navLinks = [
    ...(showCaseStudies ? [{ href: "/case-studies", label: "Case Studies" }] : []),
    ...(showBlog ? [{ href: "/blog", label: "Blog" }] : []),
    ...(showAbout ? [{ href: "/about-us", label: "About" }] : []),
  ];

  const isActive = (path: string) => location === path;

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 transition-shadow duration-200 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <a className="cursor-pointer">
                <img src={logoWordmark} alt="PipelineCast" className="h-10" />
              </a>
            </Link>
          </div>

          {/* Desktop Navigation - Minimal links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-teal"
                      : "text-navy hover:text-teal"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Desktop CTA - Outlined style */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <a className="text-sm font-medium text-navy hover:text-teal transition-colors px-3 py-2">
                Sign In
              </a>
            </Link>
            <a
              href={siteData.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-navy text-navy hover:bg-navy hover:text-white transition-colors"
              >
                Book a Call
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-navy hover:text-teal p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-medium ${
                      isActive(link.href)
                        ? "text-teal"
                        : "text-navy hover:text-teal"
                    }`}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                <Link href="/login">
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-navy hover:text-teal"
                  >
                    Sign In
                  </a>
                </Link>
                <a
                  href={siteData.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    className="w-full bg-teal hover:bg-teal-600 text-navy font-semibold"
                  >
                    Book a Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
