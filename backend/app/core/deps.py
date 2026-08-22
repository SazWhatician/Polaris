import jwt
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase import get_supabase_client
from app.models.user import AuthenticatedUser

log = get_logger(__name__)

_BEARER = "Bearer "


async def verify_id_token(request: Request) -> AuthenticatedUser:
    """FastAPI dependency: validate Supabase JWT / Session Bearer token.

    Supports Supabase Auth JWTs, Supabase get_user validation, and local demo tokens.
    """
    header = request.headers.get("Authorization", "")
    if not header.startswith(_BEARER):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = header[len(_BEARER) :].strip()

    # Demo & local development fallback tokens
    if (
        token.startswith("demo-")
        or token.startswith("test-")
        or token.startswith("mock-")
        or token.startswith("dev-")
    ):
        return AuthenticatedUser(
            uid="demo-student-123",
            email="student@polaris.edu",
            email_verified=True,
            name="Demo Student",
            picture=None,
        )

    if token.startswith("user-"):
        uid = token
        return AuthenticatedUser(
            uid=uid,
            email=f"{uid}@polaris.edu",
            email_verified=True,
            name=uid.replace("-", " ").title(),
            picture=None,
        )

    # 1. Check if Supabase client is available and validate token via get_user
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            user_response = supabase.auth.get_user(token)
            if user_response and user_response.user:
                sb_user = user_response.user
                metadata = sb_user.user_metadata or {}
                return AuthenticatedUser(
                    uid=str(sb_user.id),
                    email=sb_user.email,
                    email_verified=sb_user.email_confirmed_at is not None,
                    name=metadata.get("full_name") or metadata.get("name") or (sb_user.email.split("@")[0] if sb_user.email else "User"),
                    picture=metadata.get("avatar_url") or metadata.get("picture"),
                )
        except Exception as exc:
            log.warning("supabase.get_user_failed", error=str(exc))

    # 2. JWT decode (with secret or unverified claims fallback in dev)
    settings = get_settings()
    try:
        if settings.supabase_jwt_secret:
            decoded = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            decoded = jwt.decode(token, options={"verify_signature": False})

        uid = decoded.get("sub") or decoded.get("uid") or "demo-student-123"
        user_meta = decoded.get("user_metadata", {})
        return AuthenticatedUser(
            uid=uid,
            email=decoded.get("email"),
            email_verified=decoded.get("email_verified", False),
            name=user_meta.get("full_name") or decoded.get("name") or (decoded.get("email", "").split("@")[0] if decoded.get("email") else "User"),
            picture=user_meta.get("avatar_url") or decoded.get("picture"),
        )
    except Exception as exc:
        log.info("auth.jwt_decode_failed", error=str(exc))
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


CurrentUser = Annotated[AuthenticatedUser, Depends(verify_id_token)]


async def get_current_user_id(user: CurrentUser) -> str:
    return user.uid

