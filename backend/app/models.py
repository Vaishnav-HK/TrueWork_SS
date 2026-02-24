from sqlalchemy import Column, Integer, String, Float, Text
from .database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True)
    filename = Column(String)
    text_content = Column(Text)

class PlagiarismResult(Base):
    __tablename__ = "plagiarism_results"

    id = Column(Integer, primary_key=True, index=True)
    submission1_id = Column(Integer)
    submission2_id = Column(Integer)
    similarity_score = Column(Float)