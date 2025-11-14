import React from "react";
import { Link } from "react-router-dom";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-accent hover:text-accent/80 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-playfair">
            Shipping Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              You will receive an order confirmation email shortly after your purchase. Confirmed orders will be dispatched within 2-3 working days from the order placement. Once your order is dispatched, you will receive tracking details via email, allowing you to monitor your shipment in real time.
            </p>
            
            <p className="text-gray-700 mb-6">
              At SAAJ, we value your time and money. Our goal is to deliver order carefully in pristine condition. To ensure this, we have partnered with trusted logistics and courier services.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              Shipping Fee
            </h2>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>A flat fee of ₹69 is applied to all orders with a cart value of less than ₹799.</li>
              <li>Orders with a cart value of ₹799 or more will enjoy free shipping.</li>
              <li>Please note: The shipping fee is non-refundable under any circumstances.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              Delivery Time
            </h2>
            <p className="text-gray-700 mb-6">
              The delivery timeline may vary depending on your delivery address. However, a good estimate to keep in mind is 5-7 working days after order is dispatched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;