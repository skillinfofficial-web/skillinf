'use client';

import React, { useRef, useState, DragEvent } from 'react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  images: string[]; // base64 strings
  onChange: (images: string[]) => void;
  error?: string;
}

export default function ImageUpload({ images, onChange, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach((file) => {
      if (file.type !== 'image/webp') {
        alert(`"${file.name}" is not a WebP file. Only .webp images are accepted.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange([...images, e.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Drag-to-reorder
  const onDragStart = (index: number) => setDragIndex(index);
  const onDragEnter = (index: number) => setDragOverIndex(index);
  const onDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...images];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      onChange(reordered);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Drop zone
  const onDropZoneDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDropZoneDragLeave = () => setDragging(false);
  const onDropZoneDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className={styles.wrapper}>
      {images.length < 4 && (
        <div
          className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''} ${error ? styles.dropZoneError : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={onDropZoneDragOver}
          onDragLeave={onDropZoneDragLeave}
          onDrop={onDropZoneDrop}
        >
          <div className={styles.dropIcon}>＋</div>
          <p className={styles.dropTitle}>Upload Images</p>
          <p className={styles.dropHint}>WebP only · 1–4 images · Click or drag & drop</p>
          <input
            ref={inputRef}
            type="file"
            accept=".webp,image/webp"
            multiple
            className={styles.hiddenInput}
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((src, i) => (
            <div
              key={i}
              className={`${styles.previewCard} ${dragOverIndex === i ? styles.previewCardOver : ''}`}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`upload-${i}`} className={styles.previewImg} />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(i)}
                aria-label="Remove image"
              >×</button>
              <div className={styles.dragHandle}>⠿</div>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
      <p className={styles.hint}>{images.length}/4 images · Drag to reorder</p>
    </div>
  );
}
