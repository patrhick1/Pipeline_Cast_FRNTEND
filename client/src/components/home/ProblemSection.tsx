const problems = [
  {
    number: "01",
    title: "The Referral Trap",
    body: "Referrals got you started. But they're unpredictable, uncontrollable, and they eventually slow down. When they do, you have no backup system, and no time to build one.",
  },
  {
    number: "02",
    title: "The Visibility Myth",
    body: 'You\'ve been told to "get visible": post on LinkedIn, guest on podcasts, speak at events. But visibility without conversion is vanity. Most podcast appearances generate zero measurable pipeline.',
  },
  {
    number: "03",
    title: "The Dignity Problem",
    body: 'Cold outreach feels beneath your station. But the "dignified" alternatives (waiting, posting, hoping) don\'t give you control. You\'re stuck between looking desperate and staying invisible.',
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 bg-navy-950">
      {/* Subtle accent line at top */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal/30 to-transparent mb-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            The pipeline problem no one talks about
          </h2>
          <p className="text-lg text-gray-400">
            Most fractional CFOs hit the same wall. Here's why.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem) => (
            <div
              key={problem.number}
              className="relative p-10 rounded-xl border border-white/10 bg-white/5"
            >
              {/* Number */}
              <span className="text-6xl font-bold text-teal/20 absolute top-4 right-4">
                {problem.number}
              </span>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {problem.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{problem.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
