import axios, { AxiosInstance } from 'axios';

// API base URL - adjust for your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to read file from URI
async function readFileAsBlob(fileUri: string): Promise<Blob> {
  const response = await fetch(fileUri);
  return response.blob();
}

interface UploadResponse {
  message: string;
}

interface Submission {
  id: number;
  student_id: string;
  filename: string;
  text_content: string;
}

interface PlagiarismResultRaw {
  id: number;
  submission1_id: number;
  submission2_id: number;
  similarity_score: number;
}

interface AnalysisResult {
  studentPair: [number, number];
  studentNames: [string, string];
  semanticSimilarity: number;
  structuralSimilarity: number;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  evidenceSnippets: string[];
}

interface NetworkNode {
  id: number;
  student_id: string;
  filename: string;
  centralityScore: number;
  suspicious: boolean;
}

export const trueworkAPI = {
  /**
   * Upload multiple files to the backend
   */
  async uploadFiles(
    files: Array<{ uri: string; name: string; type: string }>,
    studentIds: string[]
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();

      console.log(`[API] Preparing to upload ${files.length} files`);

      // Read each file and add to FormData
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const studentId = studentIds[i] || `student_${i + 1}`;
        
        console.log(`[API] Reading file: ${file.name}`);
        
        // Read the file from URI as a Blob
        const fileBlob = await readFileAsBlob(file.uri);
        
        // Append the blob with filename
        formData.append('files', fileBlob, file.name);
        
        // Append corresponding student ID
        formData.append('student_ids', studentId);
        
        console.log(`[API] Added ${file.name} (${fileBlob.size} bytes) for ${studentId}`);
      }

      console.log(`[API] Uploading ${files.length} files to ${API_BASE_URL}/upload`);

      // Use fetch API for better compatibility with React Native
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Upload failed with status ${response.status}:`, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[API] Upload successful:`, data);
      return data as UploadResponse;
    } catch (error: any) {
      console.error('[API] Upload error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload files - check backend server connection');
    }
  },

  /**
   * Trigger plagiarism analysis on uploaded files
   */
  async startAnalysis(): Promise<{ message: string }> {
    try {
      console.log('[API] Starting plagiarism analysis...');
      const response = await apiClient.post('/check');
      console.log('[API] Analysis started:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Start analysis error:', error);
      throw new Error('Failed to start analysis');
    }
  },

  /**
   * Fetch analysis results and transform to frontend format
   */
  async fetchResults(): Promise<{
    analysisResults: AnalysisResult[];
    networkNodes: NetworkNode[];
  }> {
    try {
      console.log('[API] Fetching analysis results...');
      // Fetch results
      const resultsResponse = await apiClient.get<PlagiarismResultRaw[]>('/results');
      const rawResults = resultsResponse.data;
      console.log('[API] Fetched results:', rawResults);

      // Fetch submissions to map IDs to student info
      const submissionsResponse = await apiClient.get<Submission[]>('/submissions');
      const submissions = submissionsResponse.data;
      console.log('[API] Fetched submissions:', submissions);

      // Create a map of submission ID to student info
      const submissionMap: { [key: number]: Submission } = {};
      submissions.forEach((sub) => {
        submissionMap[sub.id] = sub;
      });

      // Transform results to frontend format
      const analysisResults: AnalysisResult[] = rawResults.map((result) => {
        const sub1 = submissionMap[result.submission1_id];
        const sub2 = submissionMap[result.submission2_id];

        const semanticSimilarity = result.similarity_score;
        const suspicionLevel =
          semanticSimilarity > 0.8
            ? 'critical'
            : semanticSimilarity > 0.6
              ? 'high'
              : semanticSimilarity > 0.4
                ? 'medium'
                : 'low';

        // Extract numeric IDs from student_id strings (e.g., "Student_1" -> 1)
        const extractStudentNumber = (studentId: string): number => {
          const match = studentId.match(/\d+/);
          return match ? parseInt(match[0]) : parseInt(studentId);
        };

        const studentNum1 = sub1 ? extractStudentNumber(sub1.student_id) : result.submission1_id;
        const studentNum2 = sub2 ? extractStudentNumber(sub2.student_id) : result.submission2_id;

        return {
          studentPair: [studentNum1, studentNum2],
          studentNames: [
            sub1?.student_id || `Student ${result.submission1_id}`,
            sub2?.student_id || `Student ${result.submission2_id}`,
          ],
          semanticSimilarity,
          structuralSimilarity: semanticSimilarity * 0.95, // Placeholder
          suspicionLevel,
          evidenceSnippets: [
            'Shared conceptual framework detected',
            'Similar argument structure identified',
          ],
        };
      });

      // Create network nodes from submissions
      const networkNodes: NetworkNode[] = submissions.map((sub) => ({
        id: sub.id,
        student_id: sub.student_id,
        filename: sub.filename,
        centralityScore: Math.random(),
        suspicious: Math.random() > 0.7,
      }));

      return {
        analysisResults,
        networkNodes,
      };
    } catch (error) {
      console.error('Fetch results error:', error);
      throw new Error('Failed to fetch analysis results');
    }
  },

  /**
   * Clear all data (optional)
   */
  async clearData(): Promise<void> {
    try {
      await apiClient.post('/clear');
    } catch (error) {
      console.warn('Clear data error:', error);
    }
  },
};
