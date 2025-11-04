import { Card } from "@/components/ui/card";

export default function PodcastShowcase() {
  const podcasts = [
    {
      name: "Titans of the Trades",
      image: "https://storage.buzzsprout.com/g46kafzhyc0jd9loqsymbwj11tep?.jpg"
    },
    {
      name: "Your Brand Amplified",
      image: "https://cdn-images-3.listennotes.com/podcasts/your-brand-amplified-anika-jackson-bleav-vCsgwFQ54uM-eLAt603bWqd.1400x1400.jpg"
    },
    {
      name: "Embracing Digital Transformation",
      image: "https://img.transistor.fm/6PjgCmM4ZQWZw6En18xkZC5Yip2mfIQSrFAoA9tOrLY/rs:fill:0:0:1/w:1400/h:1400/q:60/mb:500000/aHR0cHM6Ly9pbWct/dXBsb2FkLXByb2R1/Y3Rpb24udHJhbnNp/c3Rvci5mbS9jM2Ji/MDk1OTdiYzA4ZWMw/NWNlOTY0N2RhMWQ3/YmY5Mi5wbmc.jpg"
    },
    {
      name: "SaaS Fuel",
      image: "https://artwork.captivate.fm/663b7c9c-64e1-4296-8b52-3dffbf73f32e/mDUO2RtY8gY8KlwWXjY1w2uL.jpeg"
    },
    {
      name: "The Backstory on Marketing and AI",
      image: "https://cdn-images-3.listennotes.com/podcasts/the-backstory-on-marketing-and-ai-guy-powell-alDF2P6vqNC-ZJdgxc4AqzC.1400x1400.jpg"
    },
    {
      name: "Breaking Banks",
      image: "https://cdn-images-3.listennotes.com/podcasts/breaking-banks-breaking-banks-the-1-global-DPIWrEhUiza-0HQF8loqeRn.1400x1400.jpg"
    },
    {
      name: "Becoming Preferred",
      image: "https://artwork.captivate.fm/672481ac-eef5-4408-9ecc-396e163bce0b/PCm0-j3UHmAufoFWkkmmMxDi.png"
    },
    {
      name: "B2B Tech Marketing Talks",
      image: "https://pbcdn1.podbean.com/imglogo/image-logo/16362141/GTM_Playmakers_Podcast_Thumbnailb00u7.png"
    },
    {
      name: "Digital Dominance",
      image: "https://storage.buzzsprout.com/9g83x6u654xijnyuz17gktv9qx64?.jpg"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Podcasts We've Placed Clients On
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've secured placements on top-tier shows across industries—SaaS, marketing, finance, and more
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {podcasts.map((podcast, index) => (
            <Card
              key={index}
              className="p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 bg-white border-2 border-gray-100"
            >
              <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={podcast.image}
                  alt={podcast.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14">Podcast</text></svg>';
                  }}
                />
              </div>
              <h3 className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                {podcast.name}
              </h3>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-indigo-600">Join our clients</span> who've been featured on these shows and more
          </p>
        </div>
      </div>
    </section>
  );
}
