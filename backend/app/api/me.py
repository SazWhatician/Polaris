from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.models.user import AuthenticatedUser

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me", response_model=AuthenticatedUser)
async def me(user: CurrentUser) -> AuthenticatedUser:
    """Round-trip identity. The frontend calls this right after sign-in to
    confirm token verification works end-to-end."""
    return user
