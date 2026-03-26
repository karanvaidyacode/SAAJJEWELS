"""
Contact Router — /api/contact/*
Handles contact form submissions.
"""

from fastapi import APIRouter, HTTPException, Request
from app.schemas.contact import ContactFormRequest
from app.services.email import send_email
from app.config.settings import get_settings
from slowapi import Limiter
from slowapi.util import get_remote_address
import re

settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/submit")
@limiter.limit("5/minute")
async def submit_contact_form(request: Request, body: ContactFormRequest):
    """Handle contact form submission."""
    # Validate email format
    email_regex = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    if not email_regex.match(body.email):
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Please provide a valid email address"},
        )

    email_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6a856;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
            <h3>Message Details:</h3>
            <p><strong>Name:</strong> {body.name}</p>
            <p><strong>Email:</strong> {body.email}</p>
            <p><strong>Subject:</strong> {body.subject}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
            <h3>Message:</h3>
            <p>{body.message.replace(chr(10), '<br>')}</p>
        </div>
        <p>This message was sent from the contact form on your website.</p>
    </div>
    """

    # Send to business email
    await send_email(
        to=settings.EMAIL_USER or settings.EMAIL_FROM,
        subject=f"Contact Form: {body.subject}",
        html=email_content,
    )

    # Send confirmation to the user
    confirmation_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6a856;">Thank You for Contacting SaajJewels</h2>
        <p>Hello {body.name},</p>
        <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
            <h3>Your Message Details:</h3>
            <p><strong>Subject:</strong> {body.subject}</p>
            <p><strong>Message:</strong></p>
            <p>{body.message.replace(chr(10), '<br>')}</p>
        </div>
        <p>Thank you for choosing SaajJewels!</p>
        <p>The SaajJewels Team</p>
    </div>
    """

    await send_email(
        to=body.email,
        subject="Thank You for Contacting SaajJewels",
        html=confirmation_content,
    )

    return {
        "success": True,
        "message": "Your message has been sent successfully. We will contact you soon.",
    }
