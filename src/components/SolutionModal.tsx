'use client'

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (solution: string, images: string[]) => void
  currentSolution?: string | null
  currentImages?: string | null
  formId: string
  accepterName?: string
}

export default function SolutionModal({
  isOpen,
  onClose,
  onSubmit,
  currentSolution = '',
  currentImages = '',
  formId,
  accepterName
}: SolutionModalProps) {
  const [solution, setSolution] = useState(currentSolution || '')
  const [images, setImages] = useState<string[]>(currentImages ? currentImages.split(',').map(url => url.trim()) : [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to compress image
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
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
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
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

  const handleImageUpload = async (files: FileList) => {
    setIsSubmitting(true)
    try {
      // Skip bucket check since we know it exists and is working
      console.log('Starting image upload to solution-images bucket...')

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
        const fileName = `solution-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error } = await supabase.storage
          .from('solution-images')
          .upload(fileName, fileToUpload)
        
        if (error) {
          console.error('Upload error for file:', file.name, error)
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }
        
        const { data } = supabase.storage
          .from('solution-images')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solution.trim()) {
      alert('Please enter a solution')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(solution, images)
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
      handleImageUpload(e.target.files)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                accept="image/*"
                multiple
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, JPEG (max 20MB each, auto-compressed if &gt; 3MB)
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
                    <img
                      src={imageUrl}
                      alt={`Solution image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-200"
                    />
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
