import React from "react";
import { Link } from "react-router-dom";

const ReturnPolicy = () => {
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
            Return & Cancellation Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Thank you for shopping with us! As a small business, each piece is made or packed with most care. Please read our policy carefully before placing your order.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              Order Cancellations:
            </h2>
            <p className="text-gray-700 mb-6">
              We do not accept cancellations once an order has been placed. Please review your order details carefully before checking out.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              Returns & Refunds:
            </h2>
            <p className="text-gray-700 mb-4">
              We offer refunds only for items that are received in a damaged condition.
            </p>
            <p className="text-gray-700 mb-4">
              To be eligible for a refund:
            </p>
            <ol className="list-decimal pl-8 text-gray-700 mb-6 space-y-2">
              <li>You must provide a complete unboxing video from the moment the sealed package is opened, clearly showing the damage.</li>
              <li>The video must be unearned and continuous.</li>
              <li>The claim, along with the video proof, must be sent to us within 24 hours of delivery.</li>
            </ol>
            <p className="text-gray-700 mb-6">
              If the damage is verified, we will initiate a refund or offer a replacement based on your preference.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              Please note:
            </h2>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>No claims will be entertained without unboxing video proof.</li>
              <li>We do not accept returns for reasons such as change of mind, dislike of design, or incorrect size selection.</li>
            </ul>
            
            <p className="text-gray-700 mt-8">
              By placing an order with us, you agree to abide by these terms.
            </p>
            <p className="text-gray-700 mt-4">
              For any queries, feel free to reach out to our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;