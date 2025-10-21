'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Clock, Image as ImageIcon } from 'lucide-react'

interface SolutionViewModalProps {
  isOpen: boolean
  onClose: () => void
  solution: string
  solutionImages: string | null
  solutionCreatedAt: string | null
  solutionUpdatedAt: string | null
}

export default function SolutionViewModal({
  isOpen,
  onClose,
  solution,
  solutionImages,
  solutionCreatedAt,
  solutionUpdatedAt
}: SolutionViewModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
      setSelectedImageIndex(null)
    }
  }, [isOpen])

  const images = solutionImages ? solutionImages.split(',').map(url => url.trim()) : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Solution</h3>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Admin Solution</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Solution Content */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-3">Solution Details</h4>
            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-green-200 rounded-md p-3">
              {solution}
            </div>
          </div>

          {/* Solution Images */}
          {images.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Solution Images ({images.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <div className="aspect-video w-full bg-gray-100 relative">
                      <img
                        src={imageUrl}
                        alt={`Solution image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        style={{ 
                          minHeight: '120px',
                          backgroundColor: '#f9fafb',
                          display: 'block'
                        }}
                        loading="lazy"
                        onError={(e) => {
                          console.error('Error loading image:', imageUrl)
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.classList.remove('hidden')
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', imageUrl)
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.classList.add('hidden')
                        }}
                      />
                      {/* Fallback content when image fails to load */}
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Image Error</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                          <ImageIcon className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Click on any image to view full size</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2">
            {solutionCreatedAt && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Solution created: {new Date(solutionCreatedAt).toLocaleString()}</span>
              </div>
            )}
            {solutionUpdatedAt && solutionUpdatedAt !== solutionCreatedAt && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date(solutionUpdatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-60">
          <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <div className="w-6 h-6 border-l-2 border-t-2 border-white transform rotate-[-45deg]"></div>
                </button>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <div className="w-6 h-6 border-r-2 border-t-2 border-white transform rotate-45"></div>
                </button>
              </>
            )}
            
            <img
              src={images[selectedImageIndex]}
              alt={`Solution image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                console.error('Error loading lightbox image:', images[selectedImageIndex])
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
              }}
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
              {selectedImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
