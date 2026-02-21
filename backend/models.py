from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    username: str
    password: str


class TextMessageRequest(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=4000)
