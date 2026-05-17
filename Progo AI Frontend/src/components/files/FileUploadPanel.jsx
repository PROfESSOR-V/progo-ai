import { useState, useRef } from 'react';
import { FileText, UploadCloud, X, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function FileUploadPanel({
  uploadedFiles,
  activeContext,
  onToggleContext,
  onUpload,
  isUploading,
  uploadProgress,
  mode,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelection = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(e.target.files)]);
      e.target.value = '';
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    try {
      await onUpload(pendingFiles, mode);
      setPendingFiles([]);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  if (uploadedFiles.length === 0 && pendingFiles.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="border-b border-white/5">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={13} />
          <span>
            {uploadedFiles.length > 0
              ? `${activeContext.length}/${uploadedFiles.length} context files active`
              : 'No context files'}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="px-4 pb-3 animate-fade-in">
          {/* Existing files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-1 mb-3">
              {uploadedFiles.map((file, i) => (
                <button
                  key={i}
                  onClick={() => onToggleContext(file)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all ${
                    activeContext.includes(file)
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                      : 'bg-white/[0.03] border border-white/5 text-gray-500 line-through opacity-60'
                  }`}
                >
                  {activeContext.includes(file) ? (
                    <Check size={12} className="text-indigo-400 shrink-0" />
                  ) : (
                    <X size={12} className="shrink-0" />
                  )}
                  <FileText size={12} className="shrink-0" />
                  <span className="truncate">{file}</span>
                </button>
              ))}
            </div>
          )}

          {/* Upload new files */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <UploadCloud size={13} />
              <span>Add Files</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelection}
              className="hidden"
            />
          </div>

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {pendingFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-400 bg-white/[0.03] px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={12} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removePendingFile(i)}
                    className="p-0.5 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    Vectorizing... {uploadProgress > 0 && `${uploadProgress}%`}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UploadCloud size={13} />
                    Extract & Vectorize ({pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''})
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
