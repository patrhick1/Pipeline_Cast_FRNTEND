import { Check, X } from "lucide-react";

const thisIsForYou = [
  "You're 3-18 months into fractional work and referrals are slowing",
  "You want pipeline you control, not pipeline you hope for",
  "You're comfortable appearing on targeted, relevant podcasts",
  'You\'re willing to use a clear CTA (not just "brand building")',
  "You treat marketing as investment, not expense",
];

const thisIsNotForYou = [
  'You\'re looking for "get famous" visibility plays',
  "You expect us to close deals for you (we generate meetings)",
  "You won't participate in prep or approve targets",
  "You need results in under 60 days",
  "You're not ready to invest in predictable pipeline",
];

export default function QualificationSection() {
  return (
    <section id="qualification" className="py-20 bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-navy mb-4 tracking-tight">
            This is built for a specific type of CFO
          </h2>
          <p className="text-lg text-cool-gray">
            We're selective because the system requires your participation.
          </p>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* This is for you */}
          <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-8">
            <h3 className="text-lg font-semibold text-navy mb-6">
              This is for you if:
            </h3>
            <ul className="space-y-4">
              {thisIsForYou.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span className="text-cool-gray">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* This isn't for you */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-8">
            <h3 className="text-lg font-semibold text-navy mb-6">
              This isn't for you if:
            </h3>
            <ul className="space-y-4">
              {thisIsNotForYou.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-cool-gray">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
