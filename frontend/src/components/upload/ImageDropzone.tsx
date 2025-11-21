import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ImagePreview from './ImagePreview';
import './ImageDropzone.css';

interface ImageFile extends File {
  preview?: string;
}

interface ImageDropzoneProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 20;

function ImageDropzone({ 
  onFilesChange, 
  maxFiles = MAX_FILES,
  maxSize = MAX_FILE_SIZE 
}: ImageDropzoneProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newErrors: string[] = [];

    // Handle rejected files
    rejectedFiles.forEach((rejected) => {
      rejected.errors.forEach((err: any) => {
        if (err.code === 'file-too-large') {
          newErrors.push(`${rejected.file.name}: File is too large (max ${maxSize / 1024 / 1024}MB)`);
        } else if (err.code === 'file-invalid-type') {
          newErrors.push(`${rejected.file.name}: Invalid file type (only JPG, PNG, WebP allowed)`);
        } else if (err.code === 'too-many-files') {
          newErrors.push(`Too many files (max ${maxFiles} images)`);
        } else {
          newErrors.push(`${rejected.file.name}: ${err.message}`);
        }
      });
    });

    // Check if adding these files would exceed max count
    if (files.length + acceptedFiles.length > maxFiles) {
      newErrors.push(`Cannot add ${acceptedFiles.length} files. Maximum ${maxFiles} images allowed (currently ${files.length})`);
      setErrors(newErrors);
      return;
    }

    // Create preview URLs for accepted files
    const filesWithPreviews = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );

    const updatedFiles = [...files, ...filesWithPreviews];
    setFiles(updatedFiles);
    setErrors(newErrors);
    onFilesChange(updatedFiles);
  }, [files, maxFiles, maxSize, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    
    // Revoke the preview URL to avoid memory leaks
    if (files[index].preview) {
      URL.revokeObjectURL(files[index].preview!);
    }
    
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize,
    maxFiles,
    multiple: true,
    disabled: files.length >= maxFiles
  });

  // Cleanup preview URLs on unmount
  useState(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  });

  return (
    <div className="image-dropzone-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''} ${files.length >= maxFiles ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {files.length >= maxFiles ? (
            <p className="dropzone-text">Maximum {maxFiles} images reached</p>
          ) : isDragActive ? (
            <p className="dropzone-text">Drop images here...</p>
          ) : (
            <>
              <p className="dropzone-text">
                <strong>Tap to select</strong> or drag and drop images
              </p>
              <p className="dropzone-subtext">
                JPG, PNG, or WebP (max {maxSize / 1024 / 1024}MB per file, up to {maxFiles} images)
              </p>
            </>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="preview-container">
          <h3>Selected Images ({files.length}/{maxFiles})</h3>
          <div className="preview-grid">
            {files.map((file, index) => (
              <ImagePreview
                key={`${file.name}-${index}`}
                file={file}
                preview={file.preview!}
                onRemove={() => removeFile(index)}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageDropzone;
