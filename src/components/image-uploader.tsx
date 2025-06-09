
"use client";

import type { ChangeEvent, DragEvent } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import NextImage from 'next/image'; // Renamed to avoid conflict with lucide-react Image icon
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUploaded: (imageDataUri: string, originalFileName: string) => void;
  onGeneratePoem: () => void;
  isGenerating: boolean;
  currentImagePreview?: string | null;
}

export function ImageUploader({ onImageUploaded, onGeneratePoem, isGenerating, currentImagePreview }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentImagePreview) {
      setPreview(currentImagePreview);
    } else {
      setPreview(null); // Clear preview if currentImagePreview becomes null (e.g. reset)
    }
  }, [currentImagePreview]);


  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image.');
      setPreview(null);
      onImageUploaded("", ""); // Notify parent that current upload is invalid
      return;
    }
    
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setPreview(dataUri);
      onImageUploaded(dataUri, file.name);
    };
    reader.onerror = () => {
        setError('Failed to read the image file.');
        setPreview(null);
        onImageUploaded("", "");
    };
    reader.readAsDataURL(file);
  }, [onImageUploaded]);

  const handleDragEvent = (e: DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'enter' || type === 'over') {
      setDragActive(true);
    } else if (type === 'leave') {
      setDragActive(false);
    }
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => handleDragEvent(e, 'enter');
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => handleDragEvent(e, 'leave');
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => handleDragEvent(e, 'over');


  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={cn(
        'border-2 border-dashed hover:border-accent transition-all duration-300 ease-in-out',
        dragActive ? 'border-accent bg-accent/10 scale-[1.02]' : 'border-input',
        {'cursor-pointer': !preview}
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={!preview ? onBrowseClick : undefined}
    >
      <CardContent className="p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {preview ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted/20">
              <NextImage 
                src={preview} 
                alt="Uploaded preview" 
                layout="fill" 
                objectFit="contain" 
                data-ai-hint="uploaded photo" 
              />
            </div>
            <Button onClick={onGeneratePoem} disabled={isGenerating || !preview} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform active:scale-[0.98]">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Poem'
              )}
            </Button>
             <Button variant="outline" onClick={onBrowseClick} className="w-full transition-transform active:scale-[0.98]">
              Change Image
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-8">
            <UploadCloud className="mx-auto h-16 w-16 text-accent" />
            <p className="font-headline text-xl text-foreground">Drag & drop your image here</p>
            <p className="text-muted-foreground">or click to select a file</p>
            <p className="text-xs text-muted-foreground mt-1">(PNG, JPG, GIF, WebP, etc.)</p>
          </div>
        )}
        {error && (
          <div className="mt-4 text-destructive-foreground bg-destructive p-3 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
