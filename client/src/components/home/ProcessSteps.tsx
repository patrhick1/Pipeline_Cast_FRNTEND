import { Target, Mail, Mic } from "lucide-react";
import siteData from "@/data/site.json";

export default function ProcessSteps() {
  const iconMap: Record<string, any> = {
    target: Target,
    mail: Mail,
    mic: Mic
  };

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Our DFY Service Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple, streamlined, and completely hands-off for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {siteData.process.steps.map((step) => {
            const Icon = iconMap[step.icon] || Target;
            return (
              <div key={step.number} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl font-bold text-white">{step.number}</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
