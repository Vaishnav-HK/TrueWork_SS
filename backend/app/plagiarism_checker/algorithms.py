from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def cosine_similarity_check(text1: str, text2: str) -> float:
    """Calculates cosine similarity between two texts."""
    try:
        # Ensure texts are strings and not empty
        text1 = str(text1).strip()
        text2 = str(text2).strip()
        
        print(f"  Comparing texts:")
        print(f"    Text 1 length: {len(text1)} chars")
        print(f"    Text 2 length: {len(text2)} chars")
        print(f"    Texts identical: {text1 == text2}")
        
        if not text1 or not text2:
            print(f"    WARNING: Empty text detected")
            return 0.0
        
        vectorizer = TfidfVectorizer().fit_transform([text1, text2])
        vectors = vectorizer.toarray()
        similarity = cosine_similarity(vectors)[0, 1]
        
        print(f"    Similarity score: {similarity:.4f}")
        return similarity
    except Exception as e:
        print(f"    ERROR in similarity calculation: {e}")
        import traceback
        traceback.print_exc()
        return 0.0