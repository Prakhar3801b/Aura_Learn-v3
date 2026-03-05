from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class FileType(str, Enum):
    pdf = "pdf"
    image = "image"
    video = "video"


class ProcessingStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class MaterialUploadResponse(BaseModel):
    id: str
    user_id: str
    title: str
    file_type: FileType
    file_url: str
    status: ProcessingStatus
    created_at: datetime


class MaterialListItem(BaseModel):
    id: str
    title: str
    file_type: FileType
    status: ProcessingStatus
    created_at: datetime
    thumbnail_url: Optional[str] = None
