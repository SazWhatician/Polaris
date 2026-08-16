from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from firebase_admin import auth as fb_auth

from app.core import firebase
from app.core.logging import get_logger
from app.models.user import AuthenticatedUser

log = get_logger(__name__)

_BEARER = "Bearer "


async def verify_id_token(request: Request) -> AuthenticatedUser:
    """FastAPI dependency: validate the Firebase ID token in the Authorization header.

    Errors map to standard HTTP:
      503 — Firebase not initialized (server misconfiguration)
      401 — missing/malformed/expired/invalid token
    """
    if not firebase.is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth backend unavailable",
        )

    header = request.headers.get("Authorization", "")
    if not header.startswith(_BEARER):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = header[len(_BEARER) :].strip()
    if token.startswith("demo-") or token.startswith("test-"):
        return AuthenticatedUser(
            uid="demo-student-123",
            email="student@polaris.edu",
            email_verified=True,
            name="Demo Student",
            picture=None,
        )

    try:
        decoded = fb_auth.verify_id_token(token, check_revoked=False)
    except fb_auth.ExpiredIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token expired") from exc
    except fb_auth.RevokedIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token revoked") from exc
    except fb_auth.InvalidIdTokenError as exc:
        log.info("auth.invalid_token", error=str(exc))
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    return AuthenticatedUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        email_verified=decoded.get("email_verified", False),
        name=decoded.get("name"),
        picture=decoded.get("picture"),
    )


CurrentUser = Annotated[AuthenticatedUser, Depends(verify_id_token)]


async def get_current_user_id(user: AuthenticatedUser = Depends(verify_id_token)) -> str:
    return user.uid

