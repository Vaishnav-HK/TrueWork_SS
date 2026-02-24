#!/usr/bin/env python
"""
Quick test script to verify TrueWork backend is working correctly.
Run this from the backend directory: python test_backend.py
"""

import requests
import os

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("=" * 60)
    print("TrueWork Backend Test Suite")
    print("=" * 60)
    
    # Test 1: Debug endpoint
    print("\n1. Testing /debug endpoint...")
    response = requests.get(f"{BASE_URL}/debug")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Submissions in DB: {data['submissions_count']}")
        print(f"   ✓ Results in DB: {data['results_count']}")
    else:
        print(f"   ✗ Failed: {response.status_code}")
        return False
    
    # Test 2: Clear data
    print("\n2. Clearing previous test data...")
    response = requests.post(f"{BASE_URL}/clear")
    if response.status_code == 200:
        print(f"   ✓ Data cleared")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Test 3: Create test files
    print("\n3. Creating test TXT files...")
    test_files = []
    
    # File 1: Original text
    with open("test_1.txt", "w") as f:
        f.write("This is a test document about machine learning.\nMachine learning is a subset of artificial intelligence.\n")
    test_files.append(("test_1.txt", "Student_A"))
    
    # File 2: Same text (should have high similarity)
    with open("test_2.txt", "w") as f:
        f.write("This is a test document about machine learning.\nMachine learning is a subset of artificial intelligence.\n")
    test_files.append(("test_2.txt", "Student_B"))
    
    # File 3: Different text
    with open("test_3.txt", "w") as f:
        f.write("The sky is blue. The ocean is also blue. Blue is a color.\n")
    test_files.append(("test_3.txt", "Student_C"))
    
    print(f"   ✓ Created {len(test_files)} test files")
    
    # Test 4: Upload files
    print("\n4. Testing file upload...")
    
    # Open all files and keep them open during the request
    file_handles = []
    files = []
    student_ids_list = [s[1] for s in test_files]
    
    try:
        for filename, student_id in test_files:
            f = open(filename, 'rb')
            file_handles.append(f)
            files.append(('files', (filename, f, 'text/plain')))
        
        # Make the request while files are still open
        response = requests.post(
            f"{BASE_URL}/upload",
            files=files,
            data={'student_ids': student_ids_list}
        )
        
        if response.status_code == 200:
            print(f"   ✓ Upload successful: {response.json()['message']}")
        else:
            print(f"   ✗ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    finally:
        # Close all file handles
        for f in file_handles:
            f.close()
    
    # Test 5: Check submissions
    print("\n5. Checking uploaded submissions...")
    response = requests.get(f"{BASE_URL}/submissions")
    if response.status_code == 200:
        submissions = response.json()
        print(f"   ✓ Found {len(submissions)} submissions:")
        for s in submissions:
            print(f"     - {s['student_id']}: {s['filename']} ({len(s['text_content'])} chars)")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Test 6: Run analysis
    print("\n6. Running plagiarism analysis...")
    response = requests.post(f"{BASE_URL}/check")
    if response.status_code == 200:
        print(f"   ✓ Analysis complete: {response.json()['message']}")
    else:
        print(f"   ✗ Failed: {response.status_code}")
        return False
    
    # Test 7: Get results
    print("\n7. Checking analysis results...")
    response = requests.get(f"{BASE_URL}/results")
    if response.status_code == 200:
        results = response.json()
        print(f"   ✓ Found {len(results)} results:")
        for r in results:
            similarity = r['similarity_score']
            print(f"     - Pair ({r['submission1_id']}, {r['submission2_id']}): {similarity:.2%} similar")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Cleanup
    print("\n8. Cleaning up test files...")
    for filename, _ in test_files:
        if os.path.exists(filename):
            os.remove(filename)
    print("   ✓ Test files removed")
    
    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_endpoints()
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to backend!")
        print(f"   Make sure the server is running at {BASE_URL}")
        print("   Start with: python -m uvicorn app.main:app --reload --port 8000")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
