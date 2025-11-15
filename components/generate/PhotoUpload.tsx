"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>(photos);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPreviews: string[] = [];
      
      acceptedFiles.slice(0, maxPhotos - previews.length).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          newPreviews.push(result);
          
          if (newPreviews.length === acceptedFiles.length) {
            const updated = [...previews, ...newPreviews];
            setPreviews(updated);
            onPhotosChange(updated);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [previews, maxPhotos, onPhotosChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: maxPhotos,
  });

  const removePhoto = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {previews.length < maxPhotos && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium mb-2">
            {isDragActive ? "Drop photos here" : "Upload 1-5 photos"}
          </p>
          <p className="text-sm text-muted-foreground">
            Click to browse or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG, WEBP (max 10MB)
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image
                src={preview}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
              
              {/* Face Detected Badge */}
              <div className="absolute top-2 left-2">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Face
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Photo Number */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add More Button */}
          {previews.length < maxPhotos && (
            <div
              {...getRootProps()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors"
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add More</p>
              </div>
            </div>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {previews.length} of {maxPhotos} photos uploaded
        </p>
      )}
    </div>
  );
}

