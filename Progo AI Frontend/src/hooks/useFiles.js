import { useState, useCallback } from 'react';
import client from '../api/client';

export function useFiles() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeContext, setActiveContext] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = useCallback(async (sessionId = null) => {
    try {
      // If a sessionId is provided, fetch files for that specific session
      const url = sessionId 
        ? `/api/upload/files/${sessionId}` 
        : '/api/upload/files';
      const res = await client.get(url);
      const unique = [...new Set(res.data)];
      setUploadedFiles(unique);
      setActiveContext(unique);
    } catch (err) {
      console.error('Error fetching files', err);
    }
  }, []);

  const toggleContextFile = useCallback((fileName) => {
    setActiveContext(prev =>
      prev.includes(fileName)
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  }, []);

  const uploadFiles = useCallback(async (files, mode = 'qna', sessionId = null) => {
    if (!files || files.length === 0) return null;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('mode', mode);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    try {
      const res = await client.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      // After upload, re-fetch files scoped to the session
      const effectiveSessionId = sessionId || res.data?.sessionId;
      await fetchFiles(effectiveSessionId);
      return res.data;
    } catch (err) {
      console.error('Error uploading files', err);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [fetchFiles]);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setActiveContext([]);
  }, []);

  return {
    uploadedFiles,
    activeContext,
    isUploading,
    uploadProgress,
    fetchFiles,
    toggleContextFile,
    uploadFiles,
    clearFiles,
  };
}
