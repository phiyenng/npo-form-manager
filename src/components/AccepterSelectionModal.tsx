'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, User, Mail, Phone } from 'lucide-react'

interface Accepter {
  id: string
  name: string
  email: string
  phone: string
}

interface AccepterSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (accepterId: string) => void
  currentAccepterId?: string | null
}

export default function AccepterSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentAccepterId 
}: AccepterSelectionModalProps) {
  const [accepters, setAccepters] = useState<Accepter[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAccepterId, setSelectedAccepterId] = useState<string>(currentAccepterId || '')

  useEffect(() => {
    if (isOpen) {
      fetchAccepters()
    }
  }, [isOpen])

  const fetchAccepters = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('accepters')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      setAccepters(data || [])
    } catch (error) {
      console.error('Error fetching accepters:', error)
      alert('Error loading accepters')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedAccepterId) {
      onSelect(selectedAccepterId)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-curved-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl max-h-[80vh] overflow-hidden shadow-light-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Select Accepter</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading accepters...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {accepters.map((accepter) => (
                <div
                  key={accepter.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccepterId === accepter.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAccepterId(accepter.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAccepterId === accepter.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAccepterId === accepter.id && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{accepter.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{accepter.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{accepter.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedAccepterId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            Select Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
