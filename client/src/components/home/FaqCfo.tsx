import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "How is this different from podcast booking services?",
    answer:
      'Most booking services optimize for volume, "we\'ll get you on 20 podcasts!" We optimize for pipeline. We target shows where your buyers listen, build conversion systems around each appearance, and measure qualified meetings, not downloads. You approve every podcast before we reach out.',
  },
  {
    question: "What results can I expect?",
    answer:
      "We deliver qualified sales conversations, not guaranteed revenue. A qualified meeting is someone who fits your ICP, heard you on a podcast, and booked a call. Closing is on you. What we guarantee: a measurable system you can track, optimize, and scale.",
  },
  {
    question: "How long until I see results?",
    answer:
      "Podcast episodes typically air 4-8 weeks after recording. First qualified meetings usually arrive 60-90 days after launch. This is a compounding system, not a one-time campaign. If you need leads this week, this isn't right for you.",
  },
  {
    question: "What's my time commitment?",
    answer:
      "About 2-4 hours per month. You'll review and approve targets (30 min/week), do brief prep calls before recordings (30 min each), and show up for interviews. We handle research, outreach, booking, landing pages, and tracking.",
  },
  {
    question: "What does it cost?",
    answer:
      "We discuss pricing after the discovery call once we understand your situation. The system pays for itself with one closed client. If the math doesn't work for your practice, we'll tell you—we'd rather disqualify early than waste both our time.",
  },
];

export default function FaqCfo() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-off-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Centered */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-medium text-navy mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-navy pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-cool-gray flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                  <p className="text-cool-gray leading-relaxed">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
