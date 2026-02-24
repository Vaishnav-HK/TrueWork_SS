from . import algorithms

def run_check(text1: str, text2: str, algorithm: str = "cosine_similarity"):
    """Runs a specified plagiarism check algorithm."""
    if algorithm == "cosine_similarity":
        return algorithms.cosine_similarity_check(text1, text2)
    # Add more algorithms here
    raise ValueError("Unsupported algorithm")