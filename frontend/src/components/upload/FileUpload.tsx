import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Video,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analysisService } from '../../services/api';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  analysisId?: string;
  fileUrl?: string;
  preview?: string;
}

export const FileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [, setIsUploading] = useState(false);

  const createPreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const uploadFile = async (fileObj: UploadedFile) => {
    try {
      const response = await analysisService.upload(fileObj.file, {
        title: fileObj.file.name,
        description: `Upload via interface web`,
      });

      // Upload concluído com sucesso
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'completed',
                analysisId: response.data.id,
                progress: 100,
              }
            : f
        )
      );

      toast.success(`Arquivo ${fileObj.file.name} enviado com sucesso!`);
    } catch (error: any) {
      console.error('Erro no upload:', error);

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'error',
                error: error.response?.data?.error || 'Erro ao enviar arquivo',
              }
            : f
        )
      );

      toast.error(`Erro ao enviar ${fileObj.file.name}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading',
      preview: createPreview(file),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload cada arquivo
    const uploadPromises = newFiles.map(fileObj => uploadFile(fileObj));

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Erro em alguns uploads:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((file) => {
        const errors = file.errors.map(error => error.message).join(', ');
        toast.error(`Arquivo ${file.file.name} rejeitado: ${errors}`);
      });
    },
    validator: (file) => {
      // Validação adicional de tipo de arquivo
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
      ];

      if (!allowedTypes.includes(file.type)) {
        return {
          code: 'file-invalid-type',
          message: `Tipo de arquivo não suportado: ${file.type}`
        };
      }

      // Validação adicional de tamanho por tipo
      const maxSizes = {
        'image/': 50 * 1024 * 1024, // 50MB para imagens
        'video/': 100 * 1024 * 1024, // 100MB para vídeos
        'text/': 10 * 1024 * 1024, // 10MB para textos
        'application/': 25 * 1024 * 1024, // 25MB para documentos
      };

      const category = Object.keys(maxSizes).find(key => file.type.startsWith(key));
      const maxSize = category ? maxSizes[category as keyof typeof maxSizes] : 10 * 1024 * 1024;

      if (file.size > maxSize) {
        return {
          code: 'file-too-large',
          message: `Arquivo muito grande. Máximo: ${formatFileSize(maxSize)}`
        };
      }

      return null;
    }
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('text/') || file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <FileText size={24} className="text-blue-400" />;
    } else if (file.type.startsWith('application/')) {
      return <FileText size={24} className="text-orange-400" />;
    } else if (file.type.startsWith('video/')) {
      return <Video size={24} className="text-purple-400" />;
    } else if (file.type.startsWith('image/')) {
      return <Image size={24} className="text-green-400" />;
    }
    return <FileText size={24} className="text-gray-400" />;
  };

  const getFileCategory = (file: File) => {
    if (file.type.startsWith('image/')) return 'Imagem';
    if (file.type.startsWith('video/')) return 'Vídeo';
    if (file.type.startsWith('text/')) return 'Texto';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.startsWith('application/')) return 'Documento';
    return 'Arquivo';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${
            isDragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50'
          }
        `}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload
            size={48}
            className={`mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-dark-400'}`}
          />

          <h3 className="text-lg font-medium text-white mb-2">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui'}
          </h3>

          <p className="text-dark-300 mb-4">ou clique para selecionar arquivos</p>

          <div className="text-sm text-dark-400 space-y-1">
            <p>Formatos suportados: TXT, DOC, DOCX, PDF, MP4, AVI, MOV, JPG, PNG, GIF, BMP, WEBP</p>
            <div className="text-xs space-y-1 mt-2">
              <p>• Documentos: até 25MB</p>
              <p>• Imagens: até 50MB</p>
              <p>• Vídeos: até 100MB</p>
              <p>• Textos: até 10MB</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.map(fileObj => (
          <motion.div
            key={fileObj.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-dark-800 rounded-lg p-4 border border-dark-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {fileObj.preview ? (
                  <div className="relative">
                    <img
                      src={fileObj.preview}
                      alt={fileObj.file.name}
                      className="w-12 h-12 object-cover rounded-lg border border-dark-600"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-dark-800 rounded-full p-1 border border-dark-600">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {getFileIcon(fileObj.file)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 bg-dark-700 rounded-lg border border-dark-600 flex items-center justify-center">
                    {getFileIcon(fileObj.file)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{fileObj.file.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-dark-400">
                    <span>{getFileCategory(fileObj.file)}</span>
                    <span>•</span>
                    <span>{formatFileSize(fileObj.file.size)}</span>
                  </div>
                  {fileObj.analysisId && (
                    <p className="text-xs text-green-400 mt-1">ID: {fileObj.analysisId}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {fileObj.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-500">{fileObj.progress}%</span>
                  </div>
                )}

                {fileObj.status === 'completed' && (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    {fileObj.analysisId && (
                      <button
                        onClick={() => window.open(`/analysis/${fileObj.analysisId}`, '_blank')}
                        className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                        title="Ver análise"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </>
                )}

                {fileObj.status === 'error' && <AlertCircle size={16} className="text-red-500" />}

                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="text-dark-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {fileObj.status === 'uploading' && (
              <div className="mt-3">
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fileObj.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {fileObj.status === 'error' && fileObj.error && (
              <p className="mt-2 text-sm text-red-400">{fileObj.error}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Status Summary */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-800/50 rounded-lg p-4 border border-dark-700"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-dark-300">Total de arquivos: {uploadedFiles.length}</span>
            <div className="flex space-x-4 text-xs">
              <span className="text-blue-400">
                Enviando: {uploadedFiles.filter(f => f.status === 'uploading').length}
              </span>
              <span className="text-green-400">
                Concluídos: {uploadedFiles.filter(f => f.status === 'completed').length}
              </span>
              <span className="text-red-400">
                Erros: {uploadedFiles.filter(f => f.status === 'error').length}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
