import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Video, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export const FileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    // Simulate upload progress
    newFiles.forEach((fileObj, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        )
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'completed' }
              : f
          )
        )
        
        if (index === newFiles.length - 1) {
          setIsUploading(false)
          toast.success(`${acceptedFiles.length} arquivo(s) enviado(s) com sucesso!`)
        }
      }, 2000)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.doc', '.docx', '.pdf'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  })

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('text/') || file.name.endsWith('.pdf')) {
      return <FileText size={24} className="text-blue-400" />
    } else if (file.type.startsWith('video/')) {
      return <Video size={24} className="text-purple-400" />
    } else if (file.type.startsWith('image/')) {
      return <Image size={24} className="text-green-400" />
    }
    return <FileText size={24} className="text-gray-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
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
          
          <p className="text-dark-300 mb-4">
            ou clique para selecionar arquivos
          </p>
          
          <div className="text-sm text-dark-400 space-y-1">
            <p>Formatos suportados: TXT, DOC, PDF, MP4, AVI, JPG, PNG</p>
            <p>Tamanho máximo: 100MB por arquivo</p>
          </div>
        </motion.div>
      </div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.map((fileObj) => (
          <motion.div
            key={fileObj.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-dark-800 rounded-lg p-4 border border-dark-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(fileObj.file)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">
                    {fileObj.file.name}
                  </h4>
                  <p className="text-sm text-dark-400">
                    {formatFileSize(fileObj.file.size)}
                  </p>
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
                  <CheckCircle size={16} className="text-green-500" />
                )}
                
                {fileObj.status === 'error' && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
                
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

      {/* Upload Button */}
      {uploadedFiles.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          disabled={isUploading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Iniciar Análise</span>
            </>
          )}
        </motion.button>
      )}
    </div>
  )
} 