import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: November 2025
          </p>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              At Saaj Jewels, your privacy is extremely important to us. This Privacy Policy outlines how we collect, use, and protect your personal information when you visit or make a purchase from our website.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">
              When you interact with our website, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, billing and shipping address, and payment details provided during checkout.</li>
              <li><strong>Non-Personal Information:</strong> Browser type, IP address, device details, and browsing patterns collected automatically for analytics and website improvements.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>Process and fulfill your orders efficiently.</li>
              <li>Send you order confirmations, shipping updates, and customer service messages.</li>
              <li>Improve our products, website experience, and customer support.</li>
              <li>Communicate offers, promotions, or updates (only if you've opted in).</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              3. Data Protection
            </h2>
            <p className="text-gray-700 mb-6">
              Your data security is our priority. We use secure servers and industry-standard encryption to protect your personal information from unauthorized access, disclosure, or misuse.
              Payment information is processed securely through trusted and compliant payment gateways. We do not store your card or payment details.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              4. Sharing of Information
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or trade your personal information.
              We may share your information only with:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>Trusted courier and logistics partners for order delivery.</li>
              <li>Payment gateways for processing secure transactions.</li>
              <li>Legal authorities if required by law.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              5. Cookies
            </h2>
            <p className="text-gray-700 mb-6">
              Our website uses cookies to enhance your browsing experience. Cookies help us remember your preferences and improve site functionality. You can choose to disable cookies through your browser settings.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              6. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>Access or update your personal information.</li>
              <li>Opt-out of promotional emails at any time.</li>
              <li>Request deletion of your data by contacting us.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              7. Updates to This Policy
            </h2>
            <p className="text-gray-700 mb-6">
              We may occasionally update this Privacy Policy to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any updates will be posted on this page with a revised date.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              8. Contact Us
            </h2>
            <p className="text-gray-700 mb-6">
              If you have any questions or concerns about this Privacy Policy or how your information is handled, please contact us at:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>📩 Email: saajewels45@gmail.com (or your actual business email)</li>
              <li>📍 Location: Nagpur, Maharashtra, India</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;