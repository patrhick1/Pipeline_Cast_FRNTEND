import { Shield } from "lucide-react";
import siteData from "@/data/site.json";

export default function GuaranteeBand() {
  return (
    <section className="py-12 bg-gradient-to-r from-green-50 to-emerald-50 border-y border-green-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Our Guarantee
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {siteData.guarantee}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
