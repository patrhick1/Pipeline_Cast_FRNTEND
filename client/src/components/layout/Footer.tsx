import { Link } from "wouter";
import logoName from "@/img/PGL logo name.png";

export default function Footer() {
  // Check if About page should be shown (from env variable)
  const showAbout = import.meta.env.VITE_SHOW_ABOUT === 'true';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo + Tagline */}
          <div className="col-span-1">
            <img
              src={logoName}
              alt="Podcast Guest Launch"
              className="h-10 brightness-0 invert mb-4"
            />
            <p className="text-sm text-gray-500">
              Scale podcast guest appearances without the grind
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/bookings">
                  <a className="hover:text-white transition-colors">
                    Services & Pricing
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works">
                  <a className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/case-studies">
                  <a className="hover:text-white transition-colors">
                    Case Studies
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {showAbout && (
                <li>
                  <Link href="/about-us">
                    <a className="hover:text-white transition-colors">
                      About Us
                    </a>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/blog">
                  <a className="hover:text-white transition-colors">
                    Blog
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-white transition-colors">
                    Contact
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy">
                  <a className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0">
              © {currentYear} Podcast Guest Launch. All rights reserved.
            </div>
            {/* Social media icons can be added here later */}
            <div className="flex space-x-6 text-sm">
              {/* Placeholder for social links */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
