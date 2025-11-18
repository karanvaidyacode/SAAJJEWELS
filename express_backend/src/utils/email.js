const nodemailer = require("nodemailer");

// Remove quotes from password if they exist
const emailPassword = process.env.EMAIL_PASSWORD 
  ? process.env.EMAIL_PASSWORD.replace(/^"(.*)"$/, '$1').trim()
  : '';

console.log('Email config:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  hasPassword: !!emailPassword,
  from: process.env.EMAIL_FROM
});

// Log transporter configuration for debugging
console.log('Transporter config:', {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword ? '****' : 'NOT SET'
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.sendEmail = async ({ to, subject, text, html }) => {
  console.log('Email sending attempt:');
  console.log('- To:', to);
  console.log('- Subject:', subject);
  console.log('- Has HTML content:', !!html);
  console.log('- Has text content:', !!text);
  console.log('- From address:', process.env.EMAIL_FROM || "no-reply@saajjewels.com");
  console.log('- Email host:', process.env.EMAIL_HOST || "smtp.gmail.com");
  console.log('- Email port:', process.env.EMAIL_PORT || "587");
  console.log('- Email user:', process.env.EMAIL_USER);
  console.log('- Has password:', !!emailPassword);
  
  // Skip email sending in development if credentials are not set
  if (process.env.NODE_ENV === 'development' && (!process.env.EMAIL_USER || !emailPassword)) {
    console.log('Email credentials not set, skipping email send in development');
    console.log('Email content:', { to, subject });
    return { messageId: 'dev-mode-skip' };
  }
  
  try {
    console.log('Attempting to send email to:', to);
    console.log('Email subject:', subject);
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email address format:', to);
      throw new Error('Invalid email address format');
    }
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@saajjewels.com",
      to,
      subject,
      text,
      html,
    });
    
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    console.error("Error details:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    // In development, don't fail the entire operation if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log("Continuing operation despite email failure in development");
      return { messageId: 'dev-failure-skip' };
    }
    throw error;
  }
};