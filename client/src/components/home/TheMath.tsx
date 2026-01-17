const stats = [
  {
    label: "Average CFO Client LTV",
    value: "$40-100K",
    note: "Per engagement, 6-18 months typical",
  },
  {
    label: "Meetings to Close",
    value: "3-5 calls",
    note: "Typical fractional CFO sales cycle",
  },
  {
    label: "Break-Even Point",
    value: "1 client",
    note: "System pays for itself with one close",
  },
];

export default function TheMath() {
  return (
    <section className="py-20 bg-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-navy mb-4 tracking-tight">
            The math that makes this work
          </h2>
          <p className="text-lg text-cool-gray">
            This isn't magic. It's unit economics applied to podcast guesting.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-8 rounded-lg border border-gray-200"
            >
              <p className="text-sm font-medium text-cool-gray uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-4xl font-semibold text-cyan mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.note}</p>
            </div>
          ))}
        </div>

        {/* Equation Box */}
        <div className="bg-navy p-8 md:p-12 rounded-lg max-w-3xl">
          <p className="text-xl md:text-2xl text-white leading-relaxed">
            The question isn't "can I afford this?"
            <br />
            <span className="block mt-2">
              It's "what's it costing me to{" "}
              <span className="text-cyan font-semibold">NOT</span> have
              predictable pipeline?"
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
