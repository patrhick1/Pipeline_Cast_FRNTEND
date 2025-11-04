import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoName from "@/img/PGL logo name.png";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if About page should be shown (from env variable)
  const showAbout = import.meta.env.VITE_SHOW_ABOUT === 'true';
  const showCaseStudies = import.meta.env.VITE_SHOW_CASE_STUDIES === 'true';
  const showBlog = import.meta.env.VITE_SHOW_BLOG === 'true';

  const navLinks = [
    { href: "/bookings", label: "Services & Pricing" },
    ...(showCaseStudies ? [{ href: "/case-studies", label: "Case Studies" }] : []),
    ...(showBlog ? [{ href: "/blog", label: "Blog" }] : []),
    ...(showAbout ? [{ href: "/about-us", label: "About" }] : []),
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <a className="cursor-pointer">
                <img src={logoName} alt="Podcast Guest Launch" className="h-10" />
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-indigo-600"
                      : "text-gray-700 hover:text-indigo-600"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-medium ${
                      isActive(link.href)
                        ? "text-indigo-600"
                        : "text-gray-700 hover:text-indigo-600"
                    }`}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
              <div className="pt-4 border-t flex flex-col space-y-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-700 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
