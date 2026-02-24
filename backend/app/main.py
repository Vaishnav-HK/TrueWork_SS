from fastapi import FastAPI, File, UploadFile, Depends, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database
from .utils import pdf_parser
from .plagiarism_checker import core
import os
from typing import List

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "TrueWork backend is running"}

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/upload")
async def upload_pdfs(
    files: List[UploadFile] = File(...), 
    student_ids: List[str] = Form(...), 
    db: Session = Depends(get_db)
):
    """
    Handles multiple file uploads (PDF, DOCX, TXT), with each file having a corresponding student ID.
    The frontend must send the files and student_ids in the same order.
    """
    print(f"\n=== UPLOAD REQUEST ===")
    print(f"Received {len(files)} files and {len(student_ids)} student IDs")
    print(f"File names: {[f.filename for f in files]}")
    print(f"Student IDs: {student_ids}")
    print(f"File types: {[f.content_type for f in files]}")
    
    # Critical validation: Ensure we have an ID for every file.
    if len(files) != len(student_ids):
        error_detail = f"The number of files ({len(files)}) and student IDs ({len(student_ids)}) must be the same."
        print(f"ERROR: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)

    # Create the uploads directory if it doesn't exist
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    # Use zip to iterate over files and their corresponding student IDs together
    saved_count = 0
    for file, student_id in zip(files, student_ids):
        # Prevent directory traversal attacks and sanitize filename
        sanitized_filename = os.path.basename(file.filename)
        file_location = os.path.join(uploads_dir, sanitized_filename)

        print(f"\nProcessing: {sanitized_filename} for {student_id}")
        
        # Read and save file
        file_content = await file.read()
        with open(file_location, "wb") as file_object:
            file_object.write(file_content)
        print(f"  ✓ Saved to {file_location} ({len(file_content)} bytes)")

        # Extract text based on file type
        try:
            text = pdf_parser.extract_text(file_location)
            print(f"  ✓ Extracted {len(text)} characters")
            
            # Only save submission if text was successfully extracted
            if text.strip():
                submission = models.Submission(
                    student_id=student_id, 
                    filename=sanitized_filename, 
                    text_content=text
                )
                db.add(submission)
                db.flush()  # Flush to ensure ID is assigned
                print(f"  ✓ Saved submission ID {submission.id}")
                saved_count += 1
            else:
                print(f"  ✗ No text extracted from file")
        except Exception as e:
            print(f"  ✗ Error extracting text: {e}")
            import traceback
            traceback.print_exc()
    
    db.commit()
    print(f"\nUpload complete: {saved_count} submissions saved")
    print(f"===================\n")

    return {"message": f"{saved_count} files uploaded successfully."}

@app.post("/check")
async def check_plagiarism(db: Session = Depends(get_db)):
    """Runs plagiarism checks on all submissions."""
    print(f"\n=== ANALYSIS REQUEST ===")
    
    submissions = db.query(models.Submission).all()
    print(f"Found {len(submissions)} submissions to compare")
    
    for sub in submissions:
        print(f"  - ID {sub.id}: {sub.student_id} ({len(sub.text_content)} chars)")
    
    # Clear previous results
    db.query(models.PlagiarismResult).delete()
    
    result_count = 0
    for i in range(len(submissions)):
        for j in range(i + 1, len(submissions)):
            sub1 = submissions[i]
            sub2 = submissions[j]
            
            try:
                score = core.run_check(sub1.text_content, sub2.text_content)
                result = models.PlagiarismResult(
                    submission1_id=sub1.id,
                    submission2_id=sub2.id,
                    similarity_score=score
                )
                db.add(result)
                result_count += 1
                print(f"  Compared {sub1.student_id} vs {sub2.student_id}: {score:.2%}")
            except Exception as e:
                print(f"  ERROR comparing {sub1.student_id} vs {sub2.student_id}: {e}")
                import traceback
                traceback.print_exc()
    
    db.commit()
    print(f"Analysis complete: {result_count} comparisons saved")
    print(f"=======================\n")
    return {"message": "Plagiarism check complete"}

@app.get("/submissions")
async def get_submissions(db: Session = Depends(get_db)):
    """Fetches all submissions."""
    submissions = db.query(models.Submission).all()
    return submissions

@app.get("/results")
async def get_results(db: Session = Depends(get_db)):
    """Fetches plagiarism results."""
    results = db.query(models.PlagiarismResult).all()
    return results

@app.post("/clear")
async def clear_data(db: Session = Depends(get_db)):
    """Clears all submissions and results from the database."""
    db.query(models.PlagiarismResult).delete()
    db.query(models.Submission).delete()
    db.commit()
    return {"message": "All data cleared successfully"}

@app.get("/debug")
async def debug_info(db: Session = Depends(get_db)):
    """Returns debug information about current state."""
    submissions = db.query(models.Submission).all()
    results = db.query(models.PlagiarismResult).all()
    return {
        "submissions_count": len(submissions),
        "results_count": len(results),
        "submissions": [
            {"id": s.id, "student_id": s.student_id, "filename": s.filename, "text_length": len(s.text_content)}
            for s in submissions
        ],
        "results": [
            {"id": r.id, "pair": f"{r.submission1_id}-{r.submission2_id}", "similarity": r.similarity_score}
            for r in results
        ]
    }