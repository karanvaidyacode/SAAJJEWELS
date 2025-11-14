const { sendEmail } = require('../utils/email');

// Handle contact form submission
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Send email to the business email (from env)
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6a856;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <h3>Message Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p>This message was sent from the contact form on your website.</p>
      </div>
    `;

    // Send to business email
    await sendEmail({
      to: process.env.EMAIL_USER || process.env.EMAIL_FROM,
      subject: `Contact Form: ${subject}`,
      html: emailContent
    });

    // Send confirmation to the user
    const confirmationContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6a856;">Thank You for Contacting SaajJewels</h2>
        <p>Hello ${name},</p>
        <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <h3>Your Message Details:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p>Thank you for choosing SaajJewels!</p>
        <p>The SaajJewels Team</p>
      </div>
    `;

    // Send confirmation email to the user
    await sendEmail({
      to: email,
      subject: 'Thank You for Contacting SaajJewels',
      html: confirmationContent
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon.'
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      message: 'There was an error sending your message. Please try again later.'
    });
  }
};