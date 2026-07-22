"""Forgot password routes for OTP generation, verification, and password reset."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.otp import OTP
from app.config import settings
from app.routes.auth import hash_password
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets
import random
import string

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# --- Pydantic Schemas ---

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordResponse(BaseModel):
    message: str
    otp_sent: bool
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class VerifyOTPResponse(BaseModel):
    message: str
    verified: bool
    reset_token: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    message: str
    success: bool


# --- Helper Functions ---

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP."""
    return "".join(random.choices(string.digits, k=length))

def generate_reset_token() -> str:
    """Generate a secure random reset token."""
    return secrets.token_urlsafe(32)


# --- Routes ---

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Accept email, generate OTP, store in DB, return success."""
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal whether email exists for security
        return ForgotPasswordResponse(
            message="If the email exists, an OTP has been sent.",
            otp_sent=False,
            email=request.email,
        )

    # Generate OTP
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store OTP in database
    otp_record = OTP(
        user_id=user.id,
        email=request.email,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.add(otp_record)
    db.commit()

    # In production, send email with OTP
    # For development, we log the OTP
    print(f"\n=== PASSWORD RESET OTP ===")
    print(f"Email: {request.email}")
    print(f"OTP: {otp_code}")
    print(f"Expires at: {expires_at}")
    print(f"===========================\n")

    return ForgotPasswordResponse(
        message="If the email exists, an OTP has been sent. Please check your email.",
        otp_sent=True,
        email=request.email,
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """Accept email and OTP, verify and return reset token."""
    # Find valid OTP record
    otp_record = (
        db.query(OTP)
        .filter(
            OTP.email == request.email,
            OTP.otp_code == request.otp,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow(),
        )
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP. Please request a new one.",
        )

    # Mark OTP as used
    otp_record.is_used = True

    # Generate reset token
    reset_token = generate_reset_token()
    otp_record.reset_token = reset_token
    db.commit()

    return VerifyOTPResponse(
        message="OTP verified successfully.",
        verified=True,
        reset_token=reset_token,
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Accept reset token and new password, update password."""
    # Find valid OTP with this reset token
    otp_record = (
        db.query(OTP)
        .filter(
            OTP.reset_token == request.reset_token,
            OTP.is_used == True,
            OTP.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please start the password reset process again.",
        )

    # Find user and update password
    user = db.query(User).filter(User.email == otp_record.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update password using the same hash function from auth routes
    user.hashed_password = hash_password(request.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    return ResetPasswordResponse(
        message="Password reset successfully. You can now log in with your new password.",
        success=True,
    )
