import fitz  # PyMuPDF
import os

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a given PDF file."""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_text_from_txt(file_path: str) -> str:
    """Extracts text from a TXT file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except ImportError:
        # If python-docx is not installed, return empty string
        return ""

def extract_text(file_path: str) -> str:
    """Extracts text from any supported file type."""
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_ext == '.txt':
        return extract_text_from_txt(file_path)
    elif file_ext == '.docx':
        return extract_text_from_docx(file_path)
    else:
        # Default: try as text
        try:
            return extract_text_from_txt(file_path)
        except:
            return ""