'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Trash2, File, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface SolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (solution: string, images: string[], files: string[]) => void
  currentSolution?: string | null
  currentImages?: string | null
  currentFiles?: string | null
  formId?: string
  accepterName?: string
}

export default function SolutionModal({
  isOpen,
  onClose,
  onSubmit,
  currentSolution = '',
  currentImages = '',
  currentFiles = '',
  formId = ''
}: SolutionModalProps) {
  const [solution, setSolution] = useState(currentSolution || '')
  const [images, setImages] = useState<string[]>(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
  const [files, setFiles] = useState<string[]>(currentFiles ? currentFiles.split(',').map(url => url.trim()) : [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to compress image
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object with proper typing
              const compressedFile = Object.assign(new Blob([blob], { type: 'image/jpeg' }), {
                name: file.name,
                lastModified: Date.now()
              }) as File
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original file
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (files: FileList) => {
    setIsSubmitting(true)
    try {
      console.log('Starting unified file upload...')

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/zip',
          'application/x-rar-compressed',
          'application/vnd.rar'
        ]

        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.csv', '.zip', '.rar']
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
          throw new Error(`File ${file.name} is not a supported file type.`)
        }

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`)
        }

        // Check total file count (max 10 files)
        if (files.length + images.length + files.length > 10) {
          throw new Error('Maximum 10 files allowed.')
        }

        // Determine if it's an image or regular file
        const isImage = file.type.startsWith('image/')
        const bucketName = isImage ? 'solution-images' : 'solution-files'
        
        // Compress image if it's larger than 3MB
        let fileToUpload = file
        if (isImage && file.size > 3 * 1024 * 1024) { // 3MB
          console.log(`Compressing ${file.name}...`)
          fileToUpload = await compressImage(file, 2560, 0.8)
          console.log(`Compressed ${file.name}: ${file.size} -> ${fileToUpload.size} bytes`)
        }

        // Final size check after compression (15MB max for images, 50MB for files)
        const maxSize = isImage ? 15 * 1024 * 1024 : 50 * 1024 * 1024
        if (fileToUpload.size > maxSize) {
          throw new Error(`File ${file.name} is still too large after compression. Please try a smaller file.`)
        }

        // Keep original filename but add timestamp prefix to avoid conflicts
        const originalName = fileToUpload.name
        const timestamp = Date.now()
        const fileName = `${timestamp}-${originalName}`
        
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileToUpload)
        
        if (error) {
          console.error('Upload error for file:', file.name, error)
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }
        
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)
        
        return { url: data.publicUrl, isImage }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      
      // Separate images and files
      const newImages = uploadedFiles.filter(f => f.isImage).map(f => f.url)
      const newFiles = uploadedFiles.filter(f => !f.isImage).map(f => f.url)
      
      setImages(prev => [...prev, ...newImages])
      setFiles(prev => [...prev, ...newFiles])
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(`Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'txt':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'csv':
        return '📈'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📎'
    }
  }

  const getFileName = (url: string) => {
    const fileName = url.split('/').pop() || 'Unknown file'
    // Remove timestamp prefix if it exists (format: timestamp-originalname)
    const parts = fileName.split('-')
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join('-')
    }
    return fileName
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solution.trim() && images.length === 0 && files.length === 0) {
      alert('Please enter a solution or upload at least one image or file')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(solution, images, files)
      onClose()
    } catch (error) {
      console.error('Error submitting solution:', error)
      alert('Error submitting solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {currentSolution ? 'Edit Solution' : 'Add Solution'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Describe the solution in detail..."
              required
            />
          </div>

          {/* Unified Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Images & Files)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="unified-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.zip,.rar,image/*"
                multiple
              />
              <label htmlFor="unified-upload" className="cursor-pointer">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                  <File className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  Click to upload images and files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Images: PNG, JPG, JPEG (max 20MB, auto-compressed if &gt; 3MB)<br/>
                  Files: PDF, DOC, TXT, XLS, XLSX, CSV, ZIP, RAR (max 50MB each)<br/>
                  Maximum 10 files total
                </p>
              </label>
            </div>
          </div>

          {/* Display uploaded images */}
          {images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded Images ({images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={imageUrl}
                      alt={`Solution image ${index + 1}`}
                      width={100}
                      height={96}
                      className="w-full h-24 object-cover rounded-md border border-gray-200"
                      unoptimized={true}
                      onError={(e) => {
                        console.error('Error loading image:', imageUrl)
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                      <div className="text-center">
                        <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Image Error</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display uploaded files */}
          {files.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded Files ({files.length})
              </label>
              <div className="space-y-2">
                {files.map((fileUrl, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(fileUrl)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getFileName(fileUrl)}</p>
                        <p className="text-xs text-gray-500">File attachment</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !solution.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{currentSolution ? 'Update Solution' : 'Add Solution'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
