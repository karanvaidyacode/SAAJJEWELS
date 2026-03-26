import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import get_settings
import re
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_email(
    to: str,
    subject: str,
    text: str = None,
    html: str = None,
) -> dict:
    """
    Send an email via SMTP.
    Returns a dict with messageId or error info.
    """
    logger.info(f"Email sending attempt to: {to}, subject: {subject}")

    # Validate email
    email_regex = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    if not email_regex.match(to):
        logger.error(f"Invalid email address format: {to}")
        return {"messageId": "invalid-email", "error": "Invalid email address format"}

    # Check credentials
    if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
        logger.warning("No email credentials configured, skipping email send")
        return {"messageId": "no-credentials-skip"}

    try:
        # Build message
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg["Subject"] = subject

        if text:
            msg.attach(MIMEText(text, "plain"))
        if html:
            msg.attach(MIMEText(html, "html"))

        # Send
        await aiosmtplib.send(
            msg,
            hostname=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            start_tls=True,
            username=settings.EMAIL_USER,
            password=settings.EMAIL_PASSWORD.strip().strip('"'),
        )

        logger.info(f"Email sent successfully to {to}")
        return {"messageId": "sent-ok"}

    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        return {"messageId": "email-failure-skip", "error": str(e)}
