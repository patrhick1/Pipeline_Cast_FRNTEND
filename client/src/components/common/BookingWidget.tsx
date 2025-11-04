import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingWidget() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(false);

  const bookingUrl = import.meta.env.VITE_BOOKING_EMBED_URL || "https://calendly.com/your-link";
  const showBookingWidget = import.meta.env.VITE_SHOW_BOOKING_WIDGET === 'true';

  useEffect(() => {
    // Simulate loading for iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // If widget is disabled, show a button link instead
  if (!showBookingWidget) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
        <Calendar className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Book a free 15-minute strategy call to discuss your podcast booking goals.
        </p>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg">
            <Calendar className="mr-2 h-5 w-5" />
            Book Your Free Call
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking calendar...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
        <iframe
          src={bookingUrl}
          width="100%"
          height="700"
          frameBorder="0"
          className="rounded-lg"
          title="Book a strategy call"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
