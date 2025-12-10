'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, Edit3, Upload, Trash2, File, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface ResponseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (response: string, images: string[], files: string[]) => void
  currentResponse?: string | null
  currentImages?: string | null
  currentFiles?: string | null
  formId: string
  accepterName?: string
}

export default function ResponseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentResponse,
  currentImages,
  currentFiles,
  formId,
  accepterName 
}: ResponseModalProps) {
  const [response, setResponse] = useState(currentResponse || '')
  const [images, setImages] = useState<string[]>(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
  const [files, setFiles] = useState<string[]>(currentFiles ? currentFiles.split(',').map(url => url.trim()) : [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setResponse(currentResponse || '')
    setImages(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
    setFiles(currentFiles ? currentFiles.split(',').map(url => url.trim()) : [])
  }, [currentResponse, currentImages, currentFiles, isOpen])

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new File object with proper typing
            const compressedFile = Object.assign(new Blob([blob], { type: 'image/jpeg' }), {
              name: file.name,
              lastModified: Date.now()
            }) as File
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
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
        const bucketName = isImage ? 'response-images' : 'response-files'
        
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

  const handleSubmit = async () => {
    if (!response.trim() && images.length === 0 && files.length === 0) {
      alert('Please provide a response or upload at least one image or file.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(response, images, files)
      onClose()
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Error submitting response')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-curved-lg w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-hidden shadow-light-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              {currentResponse ? 'Update Response' : 'Add Response'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Form ID: {formId} {accepterName && `• Accepter: ${accepterName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                placeholder="Enter your response to the user..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide detailed feedback, solution, or status update for this ticket
              </p>
            </div>

            {/* Unified Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Images & Files)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.zip,.rar,image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="unified-upload"
                  ref={fileInputRef}
                  disabled={isSubmitting}
                />
                <label htmlFor="unified-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <File className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {isSubmitting ? 'Uploading...' : 'Click to upload images and files'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Images: PNG, JPG, JPEG (max 20MB, auto-compressed if &gt; 3MB)<br/>
                    Files: PDF, DOC, TXT, XLS, XLSX, CSV, ZIP, RAR (max 50MB each)<br/>
                    Maximum 10 files total
                  </p>
                </label>
              </div>
              
              {/* Display uploaded images */}
              {images.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uploaded Images ({images.length})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={imageUrl}
                          alt={`Response image ${index + 1}`}
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
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Image Error</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
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
                <div className="mt-4">
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
            </div>

            {currentResponse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Response
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {currentResponse}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !response.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : (currentResponse ? 'Update Response' : 'Save Response')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
