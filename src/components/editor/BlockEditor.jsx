import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2, Type, Video, Image as ImageIcon, FileText, AlertCircle, Music } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ImageUploader from '@/components/upload/ImageUploader';
import FileUploader from '@/components/upload/FileUploader';
import RichTextEditor from '@/components/editor/RichTextEditor';

const BLOCK_TYPES = {
  text: { icon: Type, label: 'Text Block', color: 'blue' },
  video: { icon: Video, label: 'Video Embed', color: 'purple' },
  image: { icon: ImageIcon, label: 'Image', color: 'green' },
  richtext: { icon: FileText, label: 'Rich Text', color: 'amber' },
  audio: { icon: Music, label: 'Audio', color: 'rose' }
};

export default function BlockEditor({ value = [], onChange, lang = 'en' }) {
  const [addingBlock, setAddingBlock] = useState(false);

  const blocks = Array.isArray(value) ? value : [];

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'richtext' ? '' : '',
      url: '',
      caption: ''
    };
    onChange([...blocks, newBlock]);
    setAddingBlock(false);
  };

  const updateBlock = (id, updates) => {
    onChange(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id) => {
    onChange(blocks.filter(block => block.id !== id));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newBlocks = Array.from(blocks);
    const [moved] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, moved);
    onChange(newBlocks);
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([^?\s]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  const text = {
    en: {
      addBlock: 'Add Content Block',
      selectType: 'Select block type',
      textPlaceholder: 'Write your text here...',
      videoUrl: 'Video URL (YouTube, Loom, or Vimeo)',
      videoPlaceholder: 'https://youtube.com/watch?v=...',
      caption: 'Caption (optional)',
      delete: 'Delete',
      dragToReorder: 'Drag to reorder',
      videoSupport: 'Supports YouTube, Loom, and Vimeo',
      noBlocks: 'No content blocks yet. Add your first block!',
      uploadAudio: 'Upload Audio File'
    },
    es: {
      addBlock: 'Añadir Bloque de Contenido',
      selectType: 'Seleccionar tipo de bloque',
      textPlaceholder: 'Escribe tu texto aquí...',
      videoUrl: 'URL del Video (YouTube, Loom, o Vimeo)',
      videoPlaceholder: 'https://youtube.com/watch?v=...',
      caption: 'Título (opcional)',
      delete: 'Eliminar',
      dragToReorder: 'Arrastra para reordenar',
      videoSupport: 'Soporta YouTube, Loom y Vimeo',
      noBlocks: '¡No hay bloques de contenido aún. Añade tu primer bloque!',
      uploadAudio: 'Subir Archivo de Audio'
    }
  };

  const t = text[lang];

  return (
    <div className="space-y-4">
      {blocks.length === 0 && !addingBlock && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">{t.noBlocks}</p>
          <Button onClick={() => setAddingBlock(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {t.addBlock}
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="group"
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div {...provided.dragHandleProps} className="pt-2 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-slate-400" />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {block.type === 'text' && <Type className="w-4 h-4 text-blue-600" />}
                                {block.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                                {block.type === 'image' && <ImageIcon className="w-4 h-4 text-green-600" />}
                                {block.type === 'richtext' && <FileText className="w-4 h-4 text-amber-600" />}
                                {block.type === 'audio' && <Music className="w-4 h-4 text-rose-600" />}
                                <span className="text-sm font-medium text-slate-700">
                                  {BLOCK_TYPES[block.type]?.label || block.type}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBlock(block.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>

                            {block.type === 'text' && (
                              <Textarea
                                value={block.content || ''}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                placeholder={t.textPlaceholder}
                                rows={4}
                              />
                            )}

                            {block.type === 'richtext' && (
                              <RichTextEditor
                                value={block.content || ''}
                                onChange={(content) => updateBlock(block.id, { content })}
                                placeholder={t.textPlaceholder}
                              />
                            )}

                            {block.type === 'video' && (
                              <div className="space-y-3">
                                <div>
                                  <Input
                                    value={block.url || ''}
                                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                    placeholder={t.videoPlaceholder}
                                  />
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {t.videoSupport}
                                  </p>
                                </div>
                                {block.url && getVideoEmbedUrl(block.url) && (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                                    <iframe
                                      src={getVideoEmbedUrl(block.url)}
                                      className="w-full h-full"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                                  placeholder={t.caption}
                                />
                              </div>
                            )}

                            {block.type === 'image' && (
                              <div className="space-y-3">
                                <ImageUploader
                                  value={block.url || ''}
                                  onChange={(url) => updateBlock(block.id, { url })}
                                  label=""
                                />
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                                  placeholder={t.caption}
                                />
                              </div>
                            )}

                            {block.type === 'audio' && (
                              <div className="space-y-3">
                                <FileUploader
                                  label={t.uploadAudio}
                                  accept="audio/*"
                                  onUploadComplete={(url) => updateBlock(block.id, { url })}
                                  lang={lang}
                                />
                                {block.url && (
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <audio controls className="w-full" controlsList="nodownload">
                                      <source src={block.url} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                )}
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                                  placeholder={t.caption}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {addingBlock ? (
        <Card className="p-4 border-2 border-[#1e3a5f]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">{t.selectType}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => addBlock('text')} className="h-auto py-4 flex flex-col gap-2">
                <Type className="w-6 h-6 text-blue-600" />
                <span className="text-xs">Text Block</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock('video')} className="h-auto py-4 flex flex-col gap-2">
                <Video className="w-6 h-6 text-purple-600" />
                <span className="text-xs">Video Embed</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock('image')} className="h-auto py-4 flex flex-col gap-2">
                <ImageIcon className="w-6 h-6 text-green-600" />
                <span className="text-xs">Image</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock('richtext')} className="h-auto py-4 flex flex-col gap-2">
                <FileText className="w-6 h-6 text-amber-600" />
                <span className="text-xs">Rich Text</span>
              </Button>
              <Button variant="outline" onClick={() => addBlock('audio')} className="h-auto py-4 flex flex-col gap-2">
                <Music className="w-6 h-6 text-rose-600" />
                <span className="text-xs">Audio</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setAddingBlock(false)} className="w-full">
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
          </div>
        </Card>
      ) : blocks.length > 0 && (
        <Button onClick={() => setAddingBlock(true)} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {t.addBlock}
        </Button>
      )}
    </div>
  );
}