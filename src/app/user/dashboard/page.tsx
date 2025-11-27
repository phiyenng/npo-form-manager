'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, FileText, MessageSquare } from 'lucide-react'
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

export default function UserDashboard() {
  const [forms, setForms] = useState<FormData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [showAllForms, setShowAllForms] = useState(false)
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
      setShowAllForms(false)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Error loading your tickets')
    } finally {
      setIsSearching(false)
    }
  }

  const fetchAllForms = async () => {
    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          accepter:accepters(id, name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setForms(data || [])
      setShowSearchForm(false)
      setShowAllForms(true)
    } catch (error) {
      console.error('Error fetching all tickets:', error)
      alert('Error loading tickets')
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
    
    // Store user info for future visits
    localStorage.setItem('userEmail', userEmail)
    
    await fetchUserForms(userEmail)
  }


  const handleViewAllForms = () => {
    fetchAllForms()
  }

  const withdrawForm = async (formId: string) => {
    if (!confirm('Are you sure you want to withdraw this ticket?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forms')
        .update({ status: 'Withdrawn' })
        .eq('id', formId)

      if (error) {
        throw error
      }

      // Update local state
      setForms(forms.map(form => 
        form.id === formId ? { ...form, status: 'Withdrawn' } : form
      ))

      alert('Ticket withdrawn successfully')
    } catch (error) {
      console.error('Error withdrawing ticket:', error)
      alert('Error withdrawing ticket')
    }
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

      // Update local state
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

      // Update local state
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Searching for your tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <Link 
                href="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {showAllForms ? 'All Ticket Submissions' : 'My Ticket Submissions'}
              </h1>
              <p className="text-gray-600">
                {showAllForms ? 'View all tickets in the system' : 'View and manage your submitted tickets'}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/form"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Submit New Ticket</span>
              </Link>
              {!showSearchForm && !showAllForms && (
                <button
                  onClick={handleViewAllForms}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <span>View All Tickets</span>
                </button>
              )}
              {showAllForms && (
                <button
                  onClick={() => {
                    setShowAllForms(false)
                    if (userEmail) {
                      fetchUserForms(userEmail)
                    } else {
                      setShowSearchForm(true)
                      setForms([])
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <span>Back to My Tickets</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        {showSearchForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Find Your Tickets</h2>
            <p className="text-gray-600 mb-6">Enter your email address to view your submitted tickets</p>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {showAllForms ? 'Total Tickets' : 'My Tickets'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Process</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Inprocess').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Closed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Withdrawn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'Withdrawn').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Forms Table */}
        {!showSearchForm && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Ticket Submissions</h2>
          </div>
          
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tickets submitted yet</p>
              <Link
                href="/form"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Submit Your First Ticket
              </Link>
            </div>
          ) : (
            <div className="table-scroll-top">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Solution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accepter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentForms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-2">
                            {/* Notification dots for unread responses and solutions */}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.issue}
                          </div>
                          <div className="text-sm text-gray-500">
                            {form.operator} - {form.country} | {form.creator}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                          {getStatusIcon(form.status)}
                          <span className="ml-1">{form.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            <>
                              <Link
                                href={`/form/edit/${form.id}`}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </Link>
                              {form.status === 'Inprocess' && (
                                <button
                                  onClick={() => withdrawForm(form.id)}
                                  className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Withdraw</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {form.status === 'Accepted' && form.accepter ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{form.accepter.name}</div>
                            <div className="text-gray-500">{form.accepter.email}</div>
                            {form.response && (
                              <div className="mt-1">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Responsed
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                    
                    {/* Page numbers */}
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
          </div>
        )}
      </div>

      {/* Form Detail Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
              <button
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
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

              {/* Response Section */}
              {selectedForm.response && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-blue-900">Response from Accepter</h4>
                    {!selectedForm.is_response_read && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-blue-200 rounded-md p-3">
                    {selectedForm.response}
                  </div>
                  {selectedForm.response_images && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Response Images:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedForm.response_images.split(',').map((imageUrl, index) => (
                          <div key={index} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="aspect-video w-full bg-gray-100 relative">
                              <Image
                                src={imageUrl.trim()}
                                alt={`Response image ${index + 1}`}
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
                                  console.error('Error loading image:', imageUrl.trim())
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.classList.remove('hidden')
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded successfully:', imageUrl.trim())
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.classList.add('hidden')
                                }}
                              />
                              {/* Fallback content when image fails to load */}
                              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
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
                    </div>
                  )}
                  {selectedForm.response_files && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Response Files:</h5>
                      <div className="space-y-2">
                        {selectedForm.response_files.split(',').map((fileUrl, index) => {
                          const fullFileName = fileUrl.split('/').pop() || `File ${index + 1}`
                          // Remove timestamp prefix if it exists (format: timestamp-originalname)
                          const parts = fullFileName.split('-')
                          const fileName = (parts.length > 1 && /^\d+$/.test(parts[0])) 
                            ? parts.slice(1).join('-') 
                            : fullFileName
                          const extension = fileUrl.split('.').pop()?.toLowerCase()
                          const getFileIcon = (ext: string) => {
                            switch (ext) {
                              case 'pdf': return '📄'
                              case 'doc':
                              case 'docx': return '📝'
                              case 'txt': return '📄'
                              case 'jpg':
                              case 'jpeg':
                              case 'png': return '🖼️'
                              case 'xls':
                              case 'xlsx': return '📊'
                              case 'csv': return '📈'
                              case 'zip':
                              case 'rar': return '📦'
                              default: return '📎'
                            }
                          }
                          return (
                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getFileIcon(extension || '')}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                                  <p className="text-xs text-gray-500">File attachment</p>
                                </div>
                              </div>
                              <a
                                href={fileUrl.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download file"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm">Download</span>
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {selectedForm.response_created_at && (
                    <p className="text-xs text-gray-600 mt-2">
                      Response created: {new Date(selectedForm.response_created_at).toLocaleString()}
                    </p>
                  )}
                  {selectedForm.response_updated_at && selectedForm.response_updated_at !== selectedForm.response_created_at && (
                    <p className="text-xs text-gray-600">
                      Last updated: {new Date(selectedForm.response_updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Solution Section */}
              {selectedForm.solution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-medium text-green-900">Solution</h4>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Admin Solution</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-green-200 rounded-md p-3">
                    {selectedForm.solution}
                  </div>
                  {selectedForm.solution_images && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Solution Images:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedForm.solution_images.split(',').map((imageUrl, index) => (
                          <div key={index} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="aspect-video w-full bg-gray-100 relative">
                              <Image
                                src={imageUrl.trim()}
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
                                  console.error('Error loading image:', imageUrl.trim())
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.classList.remove('hidden')
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded successfully:', imageUrl.trim())
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.classList.add('hidden')
                                }}
                              />
                              {/* Fallback content when image fails to load */}
                              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
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
                    </div>
                  )}
                  {selectedForm.solution_files && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Solution Files:</h5>
                      <div className="space-y-2">
                        {selectedForm.solution_files.split(',').map((fileUrl, index) => {
                          const fullFileName = fileUrl.split('/').pop() || `File ${index + 1}`
                          // Remove timestamp prefix if it exists (format: timestamp-originalname)
                          const parts = fullFileName.split('-')
                          const fileName = (parts.length > 1 && /^\d+$/.test(parts[0])) 
                            ? parts.slice(1).join('-') 
                            : fullFileName
                          const extension = fileUrl.split('.').pop()?.toLowerCase()
                          const getFileIcon = (ext: string) => {
                            switch (ext) {
                              case 'pdf': return '📄'
                              case 'doc':
                              case 'docx': return '📝'
                              case 'txt': return '📄'
                              case 'jpg':
                              case 'jpeg':
                              case 'png': return '🖼️'
                              case 'xls':
                              case 'xlsx': return '📊'
                              case 'csv': return '📈'
                              case 'zip':
                              case 'rar': return '📦'
                              default: return '📎'
                            }
                          }
                          return (
                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getFileIcon(extension || '')}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                                  <p className="text-xs text-gray-500">File attachment</p>
                                </div>
                              </div>
                              <a
                                href={fileUrl.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download file"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm">Download</span>
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {selectedForm.solution_created_at && (
                    <p className="text-xs text-gray-600 mt-2">
                      Solution created: {new Date(selectedForm.solution_created_at).toLocaleString()}
                    </p>
                  )}
                  {selectedForm.solution_updated_at && selectedForm.solution_updated_at !== selectedForm.solution_created_at && (
                    <p className="text-xs text-gray-600">
                      Last updated: {new Date(selectedForm.solution_updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}


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
                      // Handle both array and string formats
                      let fileUrls: string[] = []
                      if (Array.isArray(selectedForm.file_url)) {
                        fileUrls = selectedForm.file_url
                      } else if (typeof selectedForm.file_url === 'string') {
                        // Split by comma and clean up URLs
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

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedForm(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
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
