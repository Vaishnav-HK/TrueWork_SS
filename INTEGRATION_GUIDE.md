# TrueWork Frontend-Backend Integration Guide

## Overview
This document describes the integration between the TrueWork frontend and backend services for plagiarism detection and analysis.

## Architecture

### Frontend (React Native/Expo)
- **Location**: `/frontend`
- **Technology**: React Native, TypeScript, Expo Router
- **API Communication**: Axios HTTP client
- **State Management**: React Hooks (useState, useEffect)

### Backend (FastAPI)
- **Location**: `/backend`
- **Technology**: FastAPI, SQLAlchemy ORM, Scikit-learn
- **Database**: SQLite (default, configurable)
- **Plagiarism Detection**: TF-IDF Vectorization + Cosine Similarity

## API Endpoints

### 1. Upload Files
**Endpoint**: `POST /upload`
**Description**: Upload multiple student assignments
**Request**:
- **Parameters**: 
  - `files` (FormData): Array of file uploads (PDF, DOCX, TXT)
  - `student_ids` (FormData): Array of corresponding student IDs
- **Example**:
  ```
  POST /upload
  Content-Type: multipart/form-data
  
  files: [file1.pdf, file2.pdf, ...]
  student_ids: [Student_1, Student_2, ...]
  ```

**Response**:
```json
{
  "message": "3 files uploaded successfully."
}
```

### 2. Start Plagiarism Analysis
**Endpoint**: `POST /check`
**Description**: Run plagiarism checks on all uploaded submissions
**Request**: No parameters required
**Response**:
```json
{
  "message": "Plagiarism check complete"
}
```

### 3. Fetch Submissions
**Endpoint**: `GET /submissions`
**Description**: Retrieve all submitted documents
**Response**:
```json
[
  {
    "id": 1,
    "student_id": "Student_1",
    "filename": "assignment.pdf",
    "text_content": "..."
  },
  ...
]
```

### 4. Fetch Analysis Results
**Endpoint**: `GET /results`
**Description**: Get plagiarism analysis results
**Response**:
```json
[
  {
    "id": 1,
    "submission1_id": 1,
    "submission2_id": 2,
    "similarity_score": 0.75
  },
  ...
]
```

### 5. Clear Data
**Endpoint**: `POST /clear`
**Description**: Clear all submissions and results (useful for testing)
**Response**:
```json
{
  "message": "All data cleared successfully"
}
```

## Frontend API Service

### Location
`frontend/services/api.ts`

### Main Functions

#### `uploadFiles(files, studentIds)`
Uploads multiple files to the backend.
```typescript
const files = [
  { uri: 'file://path/to/doc1.pdf', name: 'doc1.pdf', type: 'application/pdf' },
  { uri: 'file://path/to/doc2.pdf', name: 'doc2.pdf', type: 'application/pdf' }
];
const studentIds = ['Student_1', 'Student_2'];

await trueworkAPI.uploadFiles(files, studentIds);
```

#### `startAnalysis()`
Triggers the plagiarism analysis on uploaded files.
```typescript
await trueworkAPI.startAnalysis();
```

#### `fetchResults()`
Retrieves and transforms analysis results.
```typescript
const { analysisResults, networkNodes } = await trueworkAPI.fetchResults();
```

#### `clearData()`
Clears all data from the backend.
```typescript
await trueworkAPI.clearData();
```

## Setup Instructions

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   cd backend/app
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   yarn install
   # or
   npm install
   ```

2. **Configure API URL**:
   Create or edit `.env.local`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the development server**:
   ```bash
   yarn start
   # or
   npm start
   ```

4. **Open in browser or mobile**:
   - Web: Press `w` in the terminal
   - Android: Press `a` in the terminal
   - iOS: Press `i` in the terminal

## Data Flow

### Complete Analysis Workflow

```
1. User selects files
2. Frontend uploads files to Backend
   POST /upload
   ↓
3. Backend saves files and extracts text
   ↓
4. User clicks "Start Analysis"
5. Frontend calls Backend
   POST /check
   ↓
6. Backend runs plagiarism detection
   - Compares all submission pairs
   - Calculates similarity scores
   - Saves results to database
   ↓
7. Frontend fetches results
   GET /submissions
   GET /results
   ↓
8. Frontend transforms and displays results
   - Similarity Matrix (heatmap)
   - Network Analysis (graph)
   - Suspicious Activity Reports
```

## Data Transformation (Frontend → Backend)

### File Upload
Frontend data:
```typescript
{
  uri: 'file://path/to/file.pdf'
  name: 'assignment.pdf'
  type: 'application/pdf'
}
```

Transforms to FormData:
```
files[]: <binary data>
student_ids[]: 'Student_1'
```

### Results Transformation
Backend raw data:
```typescript
{
  id: 1,
  submission1_id: 1,
  submission2_id: 2,
  similarity_score: 0.75
}
```

Frontend processed data:
```typescript
{
  studentPair: [1, 2],
  studentNames: ['Student_1', 'Student_2'],
  semanticSimilarity: 0.75,
  structuralSimilarity: 0.71,
  suspicionLevel: 'high',
  evidenceSnippets: [...]
}
```

## Configuration

### Environment Variables

**Frontend (.env.local)**
```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

**Backend (optional)**
```
DATABASE_URL=sqlite:///./test.db
```

## Testing the Integration

### 1. Using curl (Backend)

Upload files:
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "files=@/path/to/file1.pdf" \
  -F "student_ids=Student_1"
```

Start analysis:
```bash
curl -X POST "http://localhost:8000/check"
```

Get results:
```bash
curl "http://localhost:8000/results"
```

### 2. Using Postman

1. Create a new request collection
2. Import the API endpoints
3. Test each endpoint with sample files
4. Verify response data

### 3. Using Frontend UI

1. Open the app in a browser or emulator
2. Navigate to "Upload & Configure" tab
3. Select multiple PDF files
4. Click "Start TrueWork Analysis"
5. Wait for analysis to complete
6. View results in the dashboard tabs

## Error Handling

### Common Issues

**1. Connection Refused (ECONNREFUSED)**
- **Cause**: Backend server is not running
- **Solution**: Start backend with `python -m uvicorn main:app --reload`

**2. CORS Errors**
- **Cause**: Frontend and backend on different origins
- **Solution**: Backend has CORS enabled for all origins (development only)

**3. File Upload Fails**
- **Cause**: Large files or wrong file format
- **Solution**: Check file size/format, ensure server has write permissions

**4. No Results After Analysis**
- **Cause**: Analysis takes time or failed silently
- **Solution**: Check backend logs, ensure sufficient file content

## Performance Optimization

### Current Algorithms
- **Similarity Calculation**: TF-IDF + Cosine Similarity
- **Time Complexity**: O(n²) where n = number of submissions
- **Typical Speed**: ~2-5 seconds for 12 submissions

### Optimization Opportunities
1. Implement batch processing for large datasets
2. Cache similarity calculations
3. Use GPU acceleration for vectorization
4. Implement incremental updates

## Future Enhancements

1. **Advanced Algorithms**
   - Semantic similarity (word embeddings)
   - Structural pattern matching
   - Temporal analysis

2. **Real-time Updates**
   - WebSocket for live progress updates
   - Streaming results as they calculate

3. **Export Functionality**
   - PDF report generation
   - CSV export of results
   - Share reports securely

4. **Multi-file Support**
   - DOCX parsing
   - TXT file support
   - Document format detection

## Database Schema

### Submissions Table
```sql
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY,
  student_id VARCHAR,
  filename VARCHAR,
  text_content TEXT
);
```

### Plagiarism Results Table
```sql
CREATE TABLE plagiarism_results (
  id INTEGER PRIMARY KEY,
  submission1_id INTEGER,
  submission2_id INTEGER,
  similarity_score FLOAT
);
```

## Security Considerations

1. **File Upload**
   - Validate file types
   - Sanitize filenames
   - Set upload size limits
   - Scan for malware

2. **Data Privacy**
   - Encrypt sensitive data in transit (HTTPS)
   - Secure database access
   - Implement access controls
   - FERPA compliance

3. **API Security**
   - Rate limiting
   - Input validation
   - SQL injection prevention (SQLAlchemy)
   - CORS configuration

## Support & Troubleshooting

For issues:
1. Check backend logs: `tail -f /path/to/backend/logs`
2. Check frontend console: Browser DevTools → Console
3. Test API endpoints directly with curl
4. Verify environment variables are set correctly
5. Ensure all dependencies are installed

## Related Documentation
- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [API Reference](./API_REFERENCE.md)
