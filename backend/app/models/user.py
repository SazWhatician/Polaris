from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    uid: str = Field(description="Firebase UID; primary key for the user")
    email: EmailStr | None = None
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None
