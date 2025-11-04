export default function TrustStrip() {
  // This component will be enhanced later with actual logos from data/logos.json
  // For now, we'll create a simple placeholder that can be populated with real logos

  return (
    <section className="py-8 bg-gray-50 border-y">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500 mb-6">
          Featured on top podcasts and trusted by growing brands
        </p>
        {/* Logo grid will be added here when logos are available */}
        <div className="flex justify-center items-center gap-8 flex-wrap opacity-60">
          {/* Placeholder for logos - will be populated from data/logos.json */}
        </div>
      </div>
    </section>
  );
}
