from pydantic import BaseModel, ConfigDict, Field


class SpecializationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class SpecializationCreate(SpecializationBase):
    pass


class SpecializationOut(SpecializationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
