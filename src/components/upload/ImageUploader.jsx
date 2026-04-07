import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUploader({ value, onChange, label = "Image" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG or JPEG image');
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be smaller than 50MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-lg border border-slate-200 overflow-hidden">
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-48 object-cover"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => onChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL"
            className="text-sm"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG or JPEG, max 50MB
                </p>
              </div>
            </label>
          </div>
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}