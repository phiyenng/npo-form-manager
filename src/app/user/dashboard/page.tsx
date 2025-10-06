'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  id: string
  operator: string
  country: string
  issue: string
  issue_description: string
  kpis_affected: string
  counter_evaluation: string
  optimization_actions: string
  file_url: string | null
  priority: string
  start_time: string
  end_time: string | null
  creator: string
  phone_number: string
  status: string
  created_at: string
}

export default function UserDashboard() {
  const router = useRouter()
  const [forms, setForms] = useState<FormData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [showAllForms, setShowAllForms] = useState(false)

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
        .select('*')
        .eq('creator', email)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setForms(data || [])
      setShowSearchForm(false)
      setShowAllForms(false)
    } catch (error) {
      console.error('Error fetching forms:', error)
      alert('Error loading your forms')
    } finally {
      setIsSearching(false)
    }
  }

  const fetchAllForms = async () => {
    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setForms(data || [])
      setShowSearchForm(false)
      setShowAllForms(true)
    } catch (error) {
      console.error('Error fetching all forms:', error)
      alert('Error loading forms')
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
    if (!confirm('Are you sure you want to withdraw this form?')) {
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

      alert('Form withdrawn successfully')
    } catch (error) {
      console.error('Error withdrawing form:', error)
      alert('Error withdrawing form')
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
          <p className="text-gray-600">Searching for your forms...</p>
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
                {showAllForms ? 'All Form Submissions' : 'My Form Submissions'}
              </h1>
              <p className="text-gray-600">
                {showAllForms ? 'View all forms in the system' : 'View and manage your submitted forms'}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/form"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Submit New Form</span>
              </Link>
              {!showSearchForm && !showAllForms && (
                <button
                  onClick={handleViewAllForms}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <span>View All Forms</span>
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
                  <span>Back to My Forms</span>
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Find Your Forms</h2>
            <p className="text-gray-600 mb-6">Enter your email address to view your submitted forms</p>
            
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
                  <span>Search Forms</span>
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
                  {showAllForms ? 'Total Forms' : 'My Forms'}
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
            <h2 className="text-lg font-medium text-gray-900">Your Form Submissions</h2>
          </div>
          
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No forms submitted yet</p>
              <Link
                href="/form"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Submit Your First Form
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Details
                    </th>
                    {showAllForms && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creator
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {showAllForms ? 'View' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.issue}
                          </div>
                          <div className="text-sm text-gray-500">
                            {form.operator} - {form.country}
                          </div>
                        </div>
                      </td>
                      {showAllForms && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {form.creator}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(form.priority)}`}>
                          {form.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                          {getStatusIcon(form.status)}
                          <span className="ml-1">{form.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.created_at).toLocaleDateString()}
                      </td>
                      {!showAllForms ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedForm(form)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            {form.status === 'Inprocess' && (
                              <>
                                <Link
                                  href={`/form/edit/${form.id}`}
                                  className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Edit</span>
                                </Link>
                                <button
                                  onClick={() => withdrawForm(form.id)}
                                  className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Withdraw</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedForm(form)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <h3 className="text-lg font-medium text-gray-900">Form Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Attached File</label>
                  <a
                    href={selectedForm.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View File
                  </a>
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
    </div>
  )
}
