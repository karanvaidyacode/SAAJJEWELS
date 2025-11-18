import React from "react";
import { Clock, Users, Tag } from "lucide-react";
import { useOffer } from "@/contexts/OfferContext";

const OfferSection = () => {
  const { remainingOffers } = useOffer();

  return (
    <div className="w-full py-10 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-y border-amber-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-amber-900">Limited Time Offer</h3>
              <p className="text-amber-700">Hurry, offer expires soon!</p>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-900 mb-2">
              First 30 Customers Get 10% Discount
            </h2>
            <p className="text-lg text-amber-700">
              Exclusive offer for our early customers - Limited to first 30 customers only
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-amber-200">
            <Users className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">{remainingOffers} Left</span>
            <Tag className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-800">10% OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferSection;