// frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Common DOM Elements ---
    const statusDiv = document.getElementById('status');
    const resultsContainer = document.getElementById('results-container');
    const reportDiv = document.getElementById('report');
    const heatmapImg = document.getElementById('heatmap-img');
    const graphImg = document.getElementById('graph-img');

    // --- Backend API Endpoints ---
    const ANALYZE_FILES_URL = 'http://127.0.0.1:5000/analyze';
    const ANALYZE_TEXT_URL = 'http://127.0.0.1:5000/analyze-text';

    // --- 1. Event Listener for Direct Text Input ---
    const compareTextBtn = document.getElementById('compare-text-btn');
    const textInput1 = document.getElementById('text-input-1');
    const typeInput1 = document.getElementById('type-input-1');
    const textInput2 = document.getElementById('text-input-2');
    const typeInput2 = document.getElementById('type-input-2');

    compareTextBtn.addEventListener('click', async () => {
        const content1 = textInput1.value;
        const content2 = textInput2.value;

        if (!content1 || !content2) {
            updateStatus('Please paste content into both text boxes.', 'error');
            return;
        }

        const payload = {
            assignment1: { content: content1, type: typeInput1.value },
            assignment2: { content: content2, type: typeInput2.value }
        };

        updateStatus('Analyzing text inputs...', 'loading');
        
        try {
            const response = await fetch(ANALYZE_TEXT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            handleServerResponse(response);
        } catch (error) {
            updateStatus(`Error: ${error.message}`, 'error');
        }
    });

    // --- 2. Event Listener for File Uploads ---
    const uploadForm = document.getElementById('upload-form');
    const assignmentsInput = document.getElementById('assignments-input');

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (assignmentsInput.files.length < 2) {
            updateStatus('Please select at least 2 files to compare.', 'error');
            return;
        }

        updateStatus('Uploading and analyzing files...', 'loading');
        
        const formData = new FormData();
        for (const file of assignmentsInput.files) {
            formData.append('assignments', file);
        }
        
        try {
            const response = await fetch(ANALYZE_FILES_URL, {
                method: 'POST',
                body: formData
            });
            handleServerResponse(response);
        } catch (error) {
            updateStatus(`Error: ${error.message}`, 'error');
        }
    });

    // --- 3. Helper Functions ---
    async function handleServerResponse(response) {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const results = await response.json();
        displayResults(results);
    }

    function displayResults(results) {
        updateStatus('Analysis Complete!', 'success');
        reportDiv.textContent = results.report;
        // Add a timestamp to image URLs to prevent the browser from showing a cached image
        heatmapImg.src = `${results.heatmap_url}?t=${new Date().getTime()}`;
        graphImg.src = `${results.graph_url}?t=${new Date().getTime()}`;
        resultsContainer.style.display = 'block';
    }

    function updateStatus(message, type) {
        statusDiv.textContent = message;
        if (type === 'error') statusDiv.style.color = '#dc3545';
        else if (type === 'success') statusDiv.style.color = '#218838';
        else statusDiv.style.color = '#0056b3';
    }
});