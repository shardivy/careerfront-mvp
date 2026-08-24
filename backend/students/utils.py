import re

from django.conf import settings
from django.core.mail import send_mail
from students.models import Student

def generate_student_code():
    """
    Generate the next student code.

    Example:
    TMP000001
    TMP000002
    TMP000003
    """

    last_student = (
        Student.objects
        .filter(
            student_code__startswith="TMP"
        )
        .order_by("-id")
        .first()
    )

    if not last_student:
        return "TMP000001"

    match = re.search(
        r"TMP(\d+)$",
        last_student.student_code
    )

    if not match:
        return "TMP000001"

    last_number = int(match.group(1))

    next_number = last_number + 1

    return f"TMP{next_number:06d}"

def send_student_otp_email(
    student_name,
    student_email,
    otp
):
    """
    Send student email verification OTP.
    """

    subject = "CareerFront - Email Verification OTP"

    message = f"""
Hello {student_name},

Welcome to CareerFront.

Your email verification OTP is:

{otp}

Please use this OTP to verify your email address.

This OTP is valid for 10 minutes.

For security reasons, please do not share this OTP with anyone.

If you did not request this verification, please ignore this email.

Regards,
CareerFront Team
"""

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student_email],
        fail_silently=False,
    )

    return True