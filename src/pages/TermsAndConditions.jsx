import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
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
            Terms and Conditions
          </h1>
          <p className="text-gray-600 mb-8">
            Welcome to https://saajjewels.web.app
          </p>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              These Terms and Conditions govern your use of our website and the purchase of products from SAAJ. By accessing or using this website, you agree to be bound by these terms. If you do not agree with any part of these terms, please do not use our website.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              1. About Us
            </h2>
            <p className="text-gray-700 mb-6">
              Saaj jewels is a jewelry brand founded by two friends offering minimalistic, everyday jewelry pieces designed to complement a Pinterest-inspired aesthetic. Our collections are curated with love and precision for girls and womens who adore wearing delicate, stylish jewelry every day.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              2. Use of the Website
            </h2>
            <p className="text-gray-700 mb-4">
              You agree to use this website only for lawful purposes. You must not use our site:
            </p>
            <ul className="list-disc pl-8 text-gray-700 mb-6 space-y-2">
              <li>In any way that breaches any applicable local, national, or international law or regulation.</li>
              <li>To transmit any unsolicited or unauthorized advertising or promotional material.</li>
              <li>To knowingly transmit any data, send or upload material that contains viruses or any other harmful programs.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              3. Product Information
            </h2>
            <p className="text-gray-700 mb-6">
              We make every effort to display as accurately as possible the colors, designs, and details of our products. However, due to monitor differences, actual colors may vary slightly from what appears online.
            </p>
            <p className="text-gray-700 mb-6">
              All products are subject to availability. We reserve the right to limit the quantities of any products or discontinue any product at any time.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              4. Pricing and Payment
            </h2>
            <p className="text-gray-700 mb-6">
              All prices on https://saajjewels.web.app are listed in INR (Indian Rupees). We reserve the right to change prices at any time without prior notice. Payment must be made at the time of purchase. We accept various secure payment methods, which will be listed during checkout.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              5. Shipping and Delivery
            </h2>
            <p className="text-gray-700 mb-6">
              We aim to process and ship orders as quickly as possible. Estimated delivery times are provided at checkout but may vary due to unforeseen circumstances. Saaj jewels is not responsible for delays caused by third-party courier services.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              6. Returns and Refunds
            </h2>
            <p className="text-gray-700 mb-6">
              We currently do not accept returns unless the product is damaged or defective upon arrival. If you receive a faulty product, please contact us at saajewels45@gmail.com within 3 days of delivery with unboxing video with a 360° view of the package and its contents upon delivery.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              7. Intellectual Property
            </h2>
            <p className="text-gray-700 mb-6">
              All content on this website, including but not limited to logos, designs, graphics, text, and images, are the intellectual property of saaj jewels and may not be used, copied, or reproduced without our prior written consent.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-6">
              Saaj jewels shall not be liable for any indirect, incidental, or consequential damages that result from the use of, or the inability to use, our website or products.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              9. Cookies and Tracking
            </h2>
            <p className="text-gray-700 mb-6">
              We may use cookies or similar tracking technologies to enhance your browsing experience, understand how you interact with our website, and improve our services. By continuing to use this website, you consent to our use of cookies in accordance with our privacy practices.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              10. Termination
            </h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to terminate or suspend your access to the website and its services at any time, without prior notice, if we believe you have violated these Terms and Conditions or engaged in any inappropriate or unlawful activity.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 font-playfair">
              11. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the website. It is your responsibility to review these terms periodically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;