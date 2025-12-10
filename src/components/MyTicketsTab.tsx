'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, Edit, Trash2, Clock, CheckCircle, XCircle, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ResponseViewModal from '@/components/ResponseViewModal'
import SolutionViewModal from '@/components/SolutionViewModal'

interface Accepter {
  id: string
  name: string
  email: string
  phone: string
}

interface FormData {
  id: string
  form_id: string
  operator: string
  country: string
  issue: string
  issue_description: string
  kpis_affected: string
  counter_evaluation: string
  optimization_actions: string
  file_url: string[] | string | null
  priority: string
  start_time: string
  end_time: string | null
  creator: string
  phone_number: string
  status: string
  accepter_id: string | null
  response: string | null
  response_created_at: string | null
  response_updated_at: string | null
  response_images: string | null
  response_files: string | null
  is_response_read: boolean
  solution: string | null
  solution_created_at: string | null
  solution_updated_at: string | null
  solution_images: string | null
  solution_files: string | null
  is_solution_read: boolean
  accepter?: Accepter
  created_at: string
}

export default function MyTicketsTab() {
  const [forms, setForms] = useState<FormData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showSolutionModal, setShowSolutionModal] = useState(false)
  const [selectedFormForModal, setSelectedFormForModal] = useState<FormData | null>(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    // Check if user info is already stored
    const storedEmail = localStorage.getItem('userEmail')
    
    if (storedEmail) {
      setUserEmail(storedEmail)
      setShowSearchForm(false)
      fetchUserForms(storedEmail)
    }
  }, [])

  const fetchUserForms = async (email: string) => {
    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          accepter:accepters(id, name, email, phone)
        `)
        .eq('creator', email)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setForms(data || [])
      setShowSearchForm(false)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Error loading your tickets')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail.trim()) {
      alert('Please enter your email address')
      return
    }
    
    localStorage.setItem('userEmail', userEmail)
    await fetchUserForms(userEmail)
  }

  const markResponseAsRead = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_response_read: true })
        .eq('id', formId)

      if (error) {
        throw error
      }

      setForms(forms.map(form => 
        form.id === formId ? { ...form, is_response_read: true } : form
      ))
    } catch (error) {
      console.error('Error marking response as read:', error)
    }
  }

  const markSolutionAsRead = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_solution_read: true })
        .eq('id', formId)

      if (error) {
        throw error
      }

      setForms(forms.map(form => 
        form.id === formId ? { ...form, is_solution_read: true } : form
      ))
    } catch (error) {
      console.error('Error marking solution as read:', error)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(forms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentForms = forms.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const openResponseModal = (form: FormData) => {
    setSelectedFormForModal(form)
    setShowResponseModal(true)
    if (!form.is_response_read) {
      markResponseAsRead(form.id)
    }
  }

  const openSolutionModal = (form: FormData) => {
    setSelectedFormForModal(form)
    setShowSolutionModal(true)
    if (!form.is_solution_read) {
      markSolutionAsRead(form.id)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800'
      case 'Normal': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-green-100 text-green-800'
      case 'Inprocess': return 'bg-blue-100 text-blue-800'
      case 'Accepted': return 'bg-purple-100 text-purple-800'
      case 'Withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed': return <CheckCircle className="w-4 h-4" />
      case 'Inprocess': return <Clock className="w-4 h-4" />
      case 'Accepted': return <Eye className="w-4 h-4" />
      case 'Withdrawn': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Searching for your tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Search Form */}
      {showSearchForm && (
        <div className="bg-white rounded-curved-lg shadow-light p-5 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Find Your Tickets</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Enter your email address to view your submitted tickets</p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-curved px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-curved transition-all duration-300 flex items-center space-x-2 shadow-light hover:shadow-light-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search Tickets</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      {!showSearchForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-curved-lg shadow-light hover:shadow-light-md p-5 sm:p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-curved">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">My Tickets</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-curved-lg shadow-light hover:shadow-light-md p-5 sm:p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-curved">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">In Process</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Inprocess').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-curved-lg shadow-light hover:shadow-light-md p-5 sm:p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-curved">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Closed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Closed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-curved-lg shadow-light hover:shadow-light-md p-5 sm:p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-curved">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-curved-lg shadow-light hover:shadow-light-md p-5 sm:p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-curved">
                <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Withdrawn</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Withdrawn').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms Table */}
      {!showSearchForm && (
        <div className="bg-white rounded-curved-lg shadow-light overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Your Ticket Submissions</h2>
          </div>
          
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tickets submitted yet</p>
            </div>
          ) : (
            <>
              <div className="table-scroll-top">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress Content
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Solution
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accepter
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentForms.map((form) => (
                      <tr key={form.id} className="hover:bg-gray-100">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {form.response && !form.is_response_read && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="New Response"></div>
                                )}
                                {form.solution && !form.is_solution_read && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="New Solution"></div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {form.form_id}
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(form.priority)}`}>
                                {form.priority}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {form.issue}
                            </div>
                            <div className="text-sm text-gray-500">
                              {form.operator} - {form.country} | {form.creator}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {form.response ? (
                            <button
                              onClick={() => openResponseModal(form)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>View Response</span>
                              {!form.is_response_read && (
                                <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">New</span>
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {form.solution ? (
                            <button
                              onClick={() => openSolutionModal(form)}
                              className="text-green-600 hover:text-green-800 text-sm flex items-center space-x-1"
                            >
                              <FileText className="w-4 h-4" />
                              <span>View Solution</span>
                              {!form.is_solution_read && (
                                <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">New</span>
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                            {getStatusIcon(form.status)}
                            <span className="ml-1">{form.status}</span>
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedForm(form)
                                if (form.response && !form.is_response_read) {
                                  markResponseAsRead(form.id)
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Details</span>
                            </button>
                            {['Inprocess', 'Accepted'].includes(form.status) && (
                              <Link
                                href={`/form/edit/${form.id}`}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {form.status === 'Accepted' && form.accepter ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{form.accepter.name}</div>
                              <div className="text-gray-500">{form.accepter.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(form.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, forms.length)}</span> of{' '}
                        <span className="font-medium">{forms.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                          if (pageNum > totalPages) return null
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Form Detail Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-curved-lg w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto shadow-light-lg mx-4">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Ticket Details</h3>
              <button
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-curved p-1 hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ticket ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedForm.form_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Operator</label>
                  <p className="text-sm text-gray-900">{selectedForm.operator}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="text-sm text-gray-900">{selectedForm.country}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedForm.priority)}`}>
                    {selectedForm.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedForm.status)}`}>
                    {getStatusIcon(selectedForm.status)}
                    <span className="ml-1">{selectedForm.status}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <p className="text-sm text-gray-900">{new Date(selectedForm.start_time).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <p className="text-sm text-gray-900">
                    {selectedForm.end_time ? new Date(selectedForm.end_time).toLocaleString() : 'Not closed yet'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-sm text-gray-900">{selectedForm.phone_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Creator</label>
                  <p className="text-sm text-gray-900">{selectedForm.creator}</p>
                </div>
                {selectedForm.status === 'Accepted' && selectedForm.accepter && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Accepter Name</label>
                      <p className="text-sm text-gray-900">{selectedForm.accepter.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Accepter Email</label>
                      <p className="text-sm text-gray-900">{selectedForm.accepter.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Accepter Phone</label>
                      <p className="text-sm text-gray-900">{selectedForm.accepter.phone}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issue</label>
                <p className="text-sm text-gray-900">{selectedForm.issue}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Description</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.issue_description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">KPIs Affected</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.kpis_affected}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Counter Evaluation</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.counter_evaluation}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Optimization Actions</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.optimization_actions}</p>
              </div>

              {selectedForm.file_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attached Files</label>
                  <div className="space-y-1">
                    {(() => {
                      let fileUrls: string[] = []
                      if (Array.isArray(selectedForm.file_url)) {
                        fileUrls = selectedForm.file_url
                      } else if (typeof selectedForm.file_url === 'string') {
                        fileUrls = selectedForm.file_url.split(',').map(url => url.trim()).filter(url => url)
                      }
                      
                      return fileUrls.map((url, index) => (
                        <div key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            File {index + 1}
                          </a>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedForm(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-curved transition-all duration-300 shadow-light hover:shadow-light-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response View Modal */}
      <ResponseViewModal
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false)
          setSelectedFormForModal(null)
        }}
        response={selectedFormForModal?.response || ''}
        responseImages={selectedFormForModal?.response_images || null}
        responseFiles={selectedFormForModal?.response_files || null}
        responseCreatedAt={selectedFormForModal?.response_created_at || null}
        responseUpdatedAt={selectedFormForModal?.response_updated_at || null}
        accepterName={selectedFormForModal?.accepter?.name}
        accepterEmail={selectedFormForModal?.accepter?.email}
        isResponseRead={selectedFormForModal?.is_response_read || false}
        onMarkAsRead={() => {
          if (selectedFormForModal) {
            markResponseAsRead(selectedFormForModal.id)
          }
        }}
      />

      {/* Solution View Modal */}
      <SolutionViewModal
        isOpen={showSolutionModal}
        onClose={() => {
          setShowSolutionModal(false)
          setSelectedFormForModal(null)
        }}
        solution={selectedFormForModal?.solution || ''}
        solutionImages={selectedFormForModal?.solution_images || null}
        solutionFiles={selectedFormForModal?.solution_files || null}
        solutionCreatedAt={selectedFormForModal?.solution_created_at || null}
        solutionUpdatedAt={selectedFormForModal?.solution_updated_at || null}
      />
    </div>
  )
}

