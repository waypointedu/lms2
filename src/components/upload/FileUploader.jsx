import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2 } from 'lucide-react';

export default function FileUploader({ onUploadComplete, accept, label, lang = 'en', value }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(value || null);
  const [fileName, setFileName] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(file_url);
      if (onUploadComplete) onUploadComplete(file_url, file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const text = {
    en: { upload: 'Upload', remove: 'Remove' },
    es: { upload: 'Subir', remove: 'Eliminar' }
  };
  const t = text[lang];

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      {uploadedUrl ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm text-emerald-700 flex-1 truncate">{fileName || uploadedUrl}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setUploadedUrl(null);
              setFileName('');
              if (onUploadComplete) onUploadComplete(null, null);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            type="file"
            accept={accept}
            onChange={handleUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}