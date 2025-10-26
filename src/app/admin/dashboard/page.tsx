'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, LogOut, Eye, FileText, Clock, CheckCircle, XCircle, Filter, X, Trash2, MessageSquare, Edit3 } from 'lucide-react'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import AccepterSelectionModal from '@/components/AccepterSelectionModal'
import ResponseModal from '@/components/ResponseModal'
import SolutionModal from '@/components/SolutionModal'

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
  accepter?: Accepter
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [forms, setForms] = useState<FormData[]>([])
  const [filteredForms, setFilteredForms] = useState<FormData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [accepters, setAccepters] = useState<Accepter[]>([])
  const [showAccepterModal, setShowAccepterModal] = useState(false)
  const [pendingFormId, setPendingFormId] = useState<string | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedFormForResponse, setSelectedFormForResponse] = useState<FormData | null>(null)
  const [showSolutionModal, setShowSolutionModal] = useState(false)
  const [selectedFormForSolution, setSelectedFormForSolution] = useState<FormData | null>(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  
  // Filter states
  const [filters, setFilters] = useState({
    operator: '',
    priority: '',
    status: '',
    startTimeFrom: '',
    startTimeTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Apply sorting only when fetching data from database
  const applySortingOnly = useCallback((formsToSort: FormData[]) => {
    const sorted = sortFormsForAdmin(formsToSort)
    setFilteredForms(sorted)
  }, [])


  const fetchForms = useCallback(async () => {
    try {
      // Fetch forms with accepter data
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          accepter:accepters(id, name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (formsError) {
        throw formsError
      }

      // Fetch accepters list
      const { data: acceptersData, error: acceptersError } = await supabase
        .from('accepters')
        .select('*')
        .order('name')

      if (acceptersError) {
        console.error('Error fetching accepters:', acceptersError)
      } else {
        setAccepters(acceptersData || [])
      }

      setForms(formsData || [])
      // Apply sorting when fetching data from database
      applySortingOnly(formsData || [])
    } catch (error) {
      console.error('Error fetching forms:', error)
      alert('Error loading forms')
    } finally {
      setLoading(false)
    }
  }, [applySortingOnly])

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/admin')
      return
    }

    fetchForms()
  }, [router, fetchForms])



  const updateFormStatus = async (formId: string, newStatus: string, accepterId?: string) => {
    try {
      const updateData: { status: string; end_time?: string; accepter_id?: string | null } = { status: newStatus }
      
      // Auto-update end_time when status is changed to "Closed"
      if (newStatus === 'Closed') {
        updateData.end_time = new Date().toISOString()
      }

      // Handle accepter_id based on status
      if (newStatus === 'Accepted') {
        if (!accepterId) {
          alert('Please select an accepter when status is set to Accepted')
          return
        }
        updateData.accepter_id = accepterId
      } else if (newStatus === 'Closed') {
        // Keep existing accepter_id when closing (don't clear it)
        // This allows closing tickets that have been accepted and have responses/solutions
      } else {
        // Clear accepter_id for other status changes (Inprocess, etc.)
        updateData.accepter_id = null
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId)

      if (error) {
        throw error
      }

      const updatedForms = forms.map(form => {
        if (form.id === formId) {
          const updatedForm = { 
            ...form, 
            status: newStatus,
            end_time: newStatus === 'Closed' ? new Date().toISOString() : form.end_time,
            accepter_id: updateData.accepter_id ?? null
          }
          
          // Add accepter info if status is Accepted or keep existing if Closed
          if (newStatus === 'Accepted' && accepterId) {
            const accepter = accepters.find(a => a.id === accepterId)
            updatedForm.accepter = accepter
          } else if (newStatus === 'Closed' && form.accepter) {
            // Keep existing accepter info when closing
            updatedForm.accepter = form.accepter
          } else {
            updatedForm.accepter = undefined
          }
          
          return updatedForm
        }
        return form
      })
      
      setForms(updatedForms)
      // Don't re-sort, just update the filtered forms with the same order
      setFilteredForms(prev => {
        const updatedFiltered = prev.map(form => 
          form.id === formId ? updatedForms.find(f => f.id === formId) || form : form
        )
        return updatedFiltered
      })

      alert('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.filter(form => form.id !== formId)
      setForms(updatedForms)
      // Don't re-sort, just remove from filtered forms
      setFilteredForms(prev => prev.filter(form => form.id !== formId))

      alert('Ticket deleted successfully')
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Error deleting ticket')
    }
  }

  const handleResponseSubmit = async (response: string, images: string[], files: string[]) => {
    if (!selectedFormForResponse) return

    try {
      const { error } = await supabase
        .from('forms')
        .update({ 
          response,
          response_images: images.length > 0 ? images.join(',') : null,
          response_files: files.length > 0 ? files.join(',') : null
        })
        .eq('id', selectedFormForResponse.id)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.map(form => {
        if (form.id === selectedFormForResponse.id) {
          return {
            ...form,
            response,
            response_images: images.length > 0 ? images.join(',') : null,
            response_files: files.length > 0 ? files.join(',') : null,
            response_updated_at: new Date().toISOString(),
            is_response_read: false
          }
        }
        return form
      })
      
      setForms(updatedForms)
      // Don't re-sort, just update the filtered forms
      setFilteredForms(prev => {
        const updatedFiltered = prev.map(form => 
          form.id === selectedFormForResponse.id ? updatedForms.find(f => f.id === selectedFormForResponse.id) || form : form
        )
        return updatedFiltered
      })

      alert('Response saved successfully')
    } catch (error) {
      console.error('Error saving response:', error)
      alert('Error saving response')
    }
  }

  const openResponseModal = (form: FormData) => {
    setSelectedFormForResponse(form)
    setShowResponseModal(true)
  }

  const openSolutionModal = (form: FormData) => {
    setSelectedFormForSolution(form)
    setShowSolutionModal(true)
  }

  const handleSolutionSubmit = async (solution: string, images: string[], files: string[]) => {
    if (!selectedFormForSolution) return

    try {
      const solutionImages = images.length > 0 ? images.join(',') : null
      const solutionFiles = files.length > 0 ? files.join(',') : null
      
      const { error } = await supabase
        .from('forms')
        .update({ 
          solution,
          solution_images: solutionImages,
          solution_files: solutionFiles,
          solution_created_at: selectedFormForSolution.solution ? undefined : new Date().toISOString(),
          solution_updated_at: new Date().toISOString()
        })
        .eq('id', selectedFormForSolution.id)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.map(form => {
        if (form.id === selectedFormForSolution.id) {
          return {
            ...form,
            solution,
            solution_images: solutionImages,
            solution_files: solutionFiles,
            solution_created_at: form.solution_created_at || new Date().toISOString(),
            solution_updated_at: new Date().toISOString()
          }
        }
        return form
      })
      
      setForms(updatedForms)
      // Don't re-sort, just update the filtered forms
      setFilteredForms(prev => {
        const updatedFiltered = prev.map(form => 
          form.id === selectedFormForSolution.id ? updatedForms.find(f => f.id === selectedFormForSolution.id) || form : form
        )
        return updatedFiltered
      })

      alert('Solution saved successfully')
    } catch (error) {
      console.error('Error saving solution:', error)
      alert('Error saving solution')
    }
  }


  const deleteResponse = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forms')
        .update({ 
          response: null,
          response_created_at: null,
          response_updated_at: null,
          is_response_read: false
        })
        .eq('id', formId)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.map(form => {
        if (form.id === formId) {
          return {
            ...form,
            response: null,
            response_created_at: null,
            response_updated_at: null,
            is_response_read: false
          }
        }
        return form
      })
      
      setForms(updatedForms)
      // Don't re-sort, just update the filtered forms
      setFilteredForms(prev => {
        const updatedFiltered = prev.map(form => 
          form.id === formId ? updatedForms.find(f => f.id === formId) || form : form
        )
        return updatedFiltered
      })

      alert('Response deleted successfully')
    } catch (error) {
      console.error('Error deleting response:', error)
      alert('Error deleting response')
    }
  }

  const deleteSolution = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this solution? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forms')
        .update({ 
          solution: null,
          solution_images: null,
          solution_created_at: null,
          solution_updated_at: null
        })
        .eq('id', formId)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.map(form => {
        if (form.id === formId) {
          return {
            ...form,
            solution: null,
            solution_images: null,
            solution_created_at: null,
            solution_updated_at: null
          }
        }
        return form
      })
      
      setForms(updatedForms)
      // Don't re-sort, just update the filtered forms
      setFilteredForms(prev => {
        const updatedFiltered = prev.map(form => 
          form.id === formId ? updatedForms.find(f => f.id === formId) || form : form
        )
        return updatedFiltered
      })

      alert('Solution deleted successfully')
    } catch (error) {
      console.error('Error deleting solution:', error)
      alert('Error deleting solution')
    }
  }


  // Complex sorting function for admin dashboard
  const sortFormsForAdmin = (forms: FormData[]): FormData[] => {
    return [...forms].sort((a, b) => {
      // Priority order: Inprocess (newest) > Priority > Accepted > Closed
      
      // 1. Status priority: Inprocess > Accepted > Closed
      const statusOrder = { 'Inprocess': 0, 'Accepted': 1, 'Closed': 2 }
      const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3
      const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3
      
      if (statusA !== statusB) {
        return statusA - statusB
      }
      
      // 2. Within same status, sort by priority: Urgent > Normal
      if (a.status === b.status) {
        const priorityOrder = { 'Urgent': 0, 'Normal': 1 }
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
      }
      
      // 3. Within same status and priority, sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  const applyFilters = useCallback((formsToFilter: FormData[] = forms) => {
    let filtered = [...formsToFilter]

    // Filter by operator
    if (filters.operator) {
      filtered = filtered.filter(form => form.operator === filters.operator)
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(form => form.priority === filters.priority)
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(form => form.status === filters.status)
    }

    // Filter by start time range
    if (filters.startTimeFrom) {
      filtered = filtered.filter(form => 
        new Date(form.start_time) >= new Date(filters.startTimeFrom)
      )
    }

    if (filters.startTimeTo) {
      filtered = filtered.filter(form => 
        new Date(form.start_time) <= new Date(filters.startTimeTo)
      )
    }

    // Apply complex sorting for admin dashboard
    const sorted = sortFormsForAdmin(filtered)
    setFilteredForms(sorted)
    
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [forms, filters])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      operator: '',
      priority: '',
      status: '',
      startTimeFrom: '',
      startTimeTo: ''
    })
    setFilteredForms(forms)
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '')
  }

  // Apply filters when filters change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Pagination logic
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentForms = filteredForms.slice(startIndex, endIndex)

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


  const exportToExcel = () => {
    const exportData = filteredForms.map(form => ({
      'Ticket ID': form.form_id,
      'UUID': form.id,
      'Operator': form.operator,
      'Country': form.country,
      'Issue': form.issue,
      'Priority': form.priority,
      'Status': form.status,
      'Accepter Name': form.accepter?.name || '',
      'Accepter Email': form.accepter?.email || '',
      'Accepter Phone': form.accepter?.phone || '',
      'Response': form.response || '',
      'Response Created': form.response_created_at ? new Date(form.response_created_at).toLocaleString() : '',
      'Response Updated': form.response_updated_at ? new Date(form.response_updated_at).toLocaleString() : '',
      'Response Read': form.is_response_read ? 'Yes' : 'No',
      'Creator': form.creator,
      'Phone Number': form.phone_number,
      'Start Time': new Date(form.start_time).toLocaleString(),
      'End Time': form.end_time ? new Date(form.end_time).toLocaleString() : 'Not closed yet',
      'Created At': new Date(form.created_at).toLocaleString(),
      'Issue Description': form.issue_description,
      'KPIs Affected': form.kpis_affected,
      'Counter Evaluation': form.counter_evaluation,
      'Optimization Actions': form.optimization_actions,
      'File URL': form.file_url || 'No file'
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
    
    const fileName = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    router.push('/')
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
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
               <h1 className="text-2xl font-bold text-gray-900">Viettel Technical Support System</h1>
               <p className="text-gray-600">Viettel Overseas Markets</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{filteredForms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Process</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredForms.filter(f => f.status === 'Inprocess').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredForms.filter(f => f.status === 'Accepted').length}
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
                  {filteredForms.filter(f => f.status === 'Closed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Operator Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    value={filters.operator}
                    onChange={(e) => handleFilterChange('operator', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="">All Operators</option>
                    <option value="Bitel">Bitel</option>
                    <option value="Natcom">Natcom</option>
                    <option value="Nexttel">Nexttel</option>
                    <option value="Lumitel">Lumitel</option>
                    <option value="Movitel">Movitel</option>
                    <option value="Halotel">Halotel</option>
                    <option value="Unitel">Unitel</option>
                    <option value="Mytel">Mytel</option>
                    <option value="Telemor">Telemor</option>
                    <option value="Metfone">Metfone</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="">All Status</option>
                    <option value="Inprocess">Inprocess</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Start Time From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time From</label>
                  <input
                    type="datetime-local"
                    value={filters.startTimeFrom}
                    onChange={(e) => handleFilterChange('startTimeFrom', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>

                {/* Start Time To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time To</label>
                  <input
                    type="datetime-local"
                    value={filters.startTimeTo}
                    onChange={(e) => handleFilterChange('startTimeTo', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Forms Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Ticket Submissions {hasActiveFilters() && `(${filteredForms.length} of ${forms.length})`}
            </h2>
          </div>
          
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {forms.length === 0 ? 'No tickets submitted yet' : 'No tickets match the current filters'}
              </p>
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Solution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                          <div className="text-sm font-medium text-gray-900">
                            {form.form_id}
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
                        <select
                          value={form.status}
                          onChange={(e) => {
                            const newStatus = e.target.value
                            if (newStatus === 'Accepted') {
                              setPendingFormId(form.id)
                              setShowAccepterModal(true)
                            } else {
                              updateFormStatus(form.id, newStatus)
                            }
                          }}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(form.status)}`}
                        >
                          <option value="Inprocess">Inprocess</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {form.status === 'Accepted' && form.accepter ? (
                          <div className="flex items-center space-x-2">
                            {form.response ? (
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Responded</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => openResponseModal(form)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                    title="Edit Response"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteResponse(form.id)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                    title="Delete Response"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openResponseModal(form)}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>Add Response</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {form.solution ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-green-600 font-medium">Has Solution</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openSolutionModal(form)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                                title="Edit Solution"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteSolution(form.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                                title="Delete Solution"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openSolutionModal(form)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <span>Add Solution</span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedForm(form)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => deleteForm(form.id)}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {form.status === 'Accepted' && form.accepter ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{form.accepter.name}</div>
                            <div className="text-gray-500">{form.accepter.email}</div>
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
                    <span className="font-medium">{Math.min(endIndex, filteredForms.length)}</span> of{' '}
                    <span className="font-medium">{filteredForms.length}</span> results
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
                    <h4 className="text-lg font-medium text-blue-900">Response to User</h4>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Admin Response</span>
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
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedForm(null)
                        openResponseModal(selectedForm)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Response</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteResponse(selectedForm.id)
                        setSelectedForm(null)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Response</span>
                    </button>
                  </div>
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
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedForm(null)
                        openSolutionModal(selectedForm)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Solution</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteSolution(selectedForm.id)
                        setSelectedForm(null)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Solution</span>
                    </button>
                  </div>
                </div>
              )}


              {/* No Response Message */}
              {selectedForm.status === 'Accepted' && selectedForm.accepter && !selectedForm.response && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <h4 className="text-lg font-medium text-yellow-900">No Response Yet</h4>
                  </div>
                  <p className="text-sm text-yellow-800 mb-3">
                    This ticket has been accepted but no response has been sent to the user yet.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedForm(null)
                      openResponseModal(selectedForm)
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Add Response</span>
                  </button>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Creator</label>
                <p className="text-sm text-gray-900">{selectedForm.creator}</p>
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

      {/* Accepter Selection Modal */}
      <AccepterSelectionModal
        isOpen={showAccepterModal}
        onClose={() => {
          setShowAccepterModal(false)
          setPendingFormId(null)
        }}
        onSelect={(accepterId: string) => {
          if (pendingFormId) {
            updateFormStatus(pendingFormId, 'Accepted', accepterId)
          }
        }}
      />

      {/* Response Modal */}
        <ResponseModal
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false)
            setSelectedFormForResponse(null)
          }}
          onSubmit={handleResponseSubmit}
          currentResponse={selectedFormForResponse?.response}
          currentImages={selectedFormForResponse?.response_images}
          currentFiles={selectedFormForResponse?.response_files}
          formId={selectedFormForResponse?.form_id || ''}
          accepterName={selectedFormForResponse?.accepter?.name}
        />

      {/* Solution Modal */}
      <SolutionModal
        isOpen={showSolutionModal}
        onClose={() => {
          setShowSolutionModal(false)
          setSelectedFormForSolution(null)
        }}
        onSubmit={handleSolutionSubmit}
        currentSolution={selectedFormForSolution?.solution}
        currentImages={selectedFormForSolution?.solution_images}
        currentFiles={selectedFormForSolution?.solution_files}
        formId={selectedFormForSolution?.form_id || ''}
        accepterName={selectedFormForSolution?.accepter?.name}
      />
    </div>
  )
}
