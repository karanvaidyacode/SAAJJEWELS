import React from "react";
import { Gift } from "lucide-react";

const FreeGiftSection = () => {
  return (
    <div className="w-full py-12 bg-gradient-to-r from-rose-50 to-amber-50 border-y border-rose-100">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-6">
          <Gift className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-rose-900 mb-4">
          Every Order Comes With a Free Gift
        </h2>
        <p className="text-lg text-rose-700 max-w-2xl mx-auto">
          Surprise included with every purchase - because you deserve something special
        </p>
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-rose-200">
            <span className="text-rose-800 font-medium">🎁 Limited Time Offer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeGiftSection;