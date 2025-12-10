'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Clock, Image as ImageIcon, File, Download } from 'lucide-react'
import Image from 'next/image'

interface SolutionViewModalProps {
  isOpen: boolean
  onClose: () => void
  solution: string
  solutionImages: string | null
  solutionFiles: string | null
  solutionCreatedAt: string | null
  solutionUpdatedAt: string | null
}

export default function SolutionViewModal({
  isOpen,
  onClose,
  solution,
  solutionImages,
  solutionFiles,
  solutionCreatedAt,
  solutionUpdatedAt
}: SolutionViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedImageIndex(null)
    }
  }, [isOpen])

  const images = solutionImages ? solutionImages.split(',').map(url => url.trim()) : []
  const files = solutionFiles ? solutionFiles.split(',').map(url => url.trim()) : []

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
    return url.split('/').pop() || 'Unknown file'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-curved-lg w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto shadow-light-lg mx-4">
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
                      <Image
                        src={imageUrl}
                        alt={`Solution image ${index + 1}`}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        style={{ 
                          minHeight: '120px',
                          backgroundColor: '#f9fafb',
                          display: 'block'
                        }}
                        loading="lazy"
                        unoptimized={true}
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

          {/* Solution Files */}
          {files.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <File className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Solution Files ({files.length})</h4>
              </div>
              <div className="space-y-2">
                {files.map((fileUrl, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(fileUrl)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getFileName(fileUrl)}</p>
                        <p className="text-xs text-gray-500">File attachment</p>
                      </div>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </a>
                  </div>
                ))}
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
            
            <Image
              src={images[selectedImageIndex]}
              alt={`Solution image ${selectedImageIndex + 1}`}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              unoptimized={true}
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
