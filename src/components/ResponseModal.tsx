'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, Edit3, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ResponseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (response: string, images: string[]) => void
  currentResponse?: string | null
  currentImages?: string | null
  formId: string
  accepterName?: string
}

export default function ResponseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentResponse,
  currentImages,
  formId,
  accepterName 
}: ResponseModalProps) {
  const [response, setResponse] = useState(currentResponse || '')
  const [images, setImages] = useState<string[]>(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setResponse(currentResponse || '')
    setImages(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
  }, [currentResponse, currentImages, isOpen])

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (files: FileList) => {
    setIsSubmitting(true)
    try {
      // Skip bucket check since we know it exists and is working
      console.log('Starting image upload to response-images bucket...')

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`)
        }

        // Validate file size (20MB max before compression)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 20MB.`)
        }

        // Compress image if it's larger than 3MB
        let fileToUpload = file
        if (file.size > 3 * 1024 * 1024) { // 3MB
          console.log(`Compressing ${file.name}...`)
          fileToUpload = await compressImage(file, 2560, 0.8) // Higher quality, larger max width
          console.log(`Compressed ${file.name}: ${file.size} -> ${fileToUpload.size} bytes`)
        }

        // Final size check after compression (15MB max)
        if (fileToUpload.size > 15 * 1024 * 1024) {
          throw new Error(`File ${file.name} is still too large after compression. Please try a smaller image.`)
        }

        const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
        const fileName = `response-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error } = await supabase.storage
          .from('response-images')
          .upload(fileName, fileToUpload)
        
        if (error) {
          console.error('Upload error for file:', file.name, error)
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }
        
        const { data } = supabase.storage
          .from('response-images')
          .getPublicUrl(fileName)
        
        return data.publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert(`Error uploading images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!response.trim() && images.length === 0) {
      alert('Please provide a response or upload at least one image.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(response, images)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
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

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Images (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="response-image-upload"
                  ref={fileInputRef}
                  disabled={isSubmitting}
                />
                <label htmlFor="response-image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isSubmitting ? 'Uploading...' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG (max 20MB each, auto-compressed if &gt; 3MB)
                  </p>
                </label>
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Response image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border border-gray-200"
                      />
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
