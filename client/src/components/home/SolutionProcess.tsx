const steps = [
  {
    number: 1,
    title: "Strategic Targeting",
    body: "We identify podcasts where your ideal clients actually listen. Not vanity shows. Not \"big audience\" plays. Targeted, relevant, decision-maker-adjacent shows.",
    tag: "You approve every target",
  },
  {
    number: 2,
    title: "Placement + Preparation",
    body: "We handle outreach, booking, and scheduling. You show up prepared with talking points that naturally lead listeners toward a conversation with you.",
    tag: "Done-for-you booking",
  },
  {
    number: 3,
    title: "Conversion Architecture",
    body: 'We build the system that turns listeners into leads: dedicated landing pages, tracking, follow-up sequences. Every appearance feeds measurable pipeline, not just "awareness."',
    tag: "Measurable results",
  },
];

export default function SolutionProcess() {
  return (
    <section id="process" className="py-20 bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-navy mb-4 tracking-tight">
            A system that turns appearances into conversations
          </h2>
          <p className="text-lg text-cool-gray">
            Three stages. Full transparency. You approve every podcast before we
            reach out.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative max-w-3xl">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {steps.map((step, index) => (
            <div key={step.number} className="relative flex gap-8 pb-16 last:pb-0">
              {/* Number circle */}
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-cyan text-navy font-semibold flex items-center justify-center text-lg">
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-navy mb-3">
                  {step.title}
                </h3>
                <p className="text-cool-gray leading-relaxed mb-4">
                  {step.body}
                </p>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-navy text-white rounded-full">
                  {step.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
