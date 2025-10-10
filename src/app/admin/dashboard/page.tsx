'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Download, LogOut, Eye, FileText, Clock, CheckCircle, XCircle, Filter, X, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'

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

export default function AdminDashboard() {
  const router = useRouter()
  const [forms, setForms] = useState<FormData[]>([])
  const [filteredForms, setFilteredForms] = useState<FormData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    operator: '',
    priority: '',
    status: '',
    startTimeFrom: '',
    startTimeTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/admin')
      return
    }

    fetchForms()
  }, [router])

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setForms(data || [])
      setFilteredForms(data || [])
    } catch (error) {
      console.error('Error fetching forms:', error)
      alert('Error loading forms')
    } finally {
      setLoading(false)
    }
  }

  const updateFormStatus = async (formId: string, newStatus: string) => {
    try {
      const updateData: { status: string; end_time?: string } = { status: newStatus }
      
      // Auto-update end_time when status is changed to "Closed"
      if (newStatus === 'Closed') {
        updateData.end_time = new Date().toISOString()
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId)

      if (error) {
        throw error
      }

      // Update local state
      const updatedForms = forms.map(form => 
        form.id === formId ? { 
          ...form, 
          status: newStatus,
          end_time: newStatus === 'Closed' ? new Date().toISOString() : form.end_time
        } : form
      )
      
      setForms(updatedForms)
      applyFilters(updatedForms)

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
      applyFilters(updatedForms)

      alert('Ticket deleted successfully')
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Error deleting ticket')
    }
  }

  const applyFilters = (formsToFilter: FormData[] = forms) => {
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

    setFilteredForms(filtered)
  }

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
  }, [filters])

  const exportToExcel = () => {
    const exportData = filteredForms.map(form => ({
      'ID': form.id,
      'Operator': form.operator,
      'Country': form.country,
      'Issue': form.issue,
      'Priority': form.priority,
      'Status': form.status,
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
                      Ticket Details
                    </th>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-100">
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(form.priority)}`}>
                          {form.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={form.status}
                          onChange={(e) => updateFormStatus(form.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(form.status)}`}
                        >
                          <option value="Inprocess">Inprocess</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.created_at).toLocaleDateString()}
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
                    </tr>
                  ))}
                </tbody>
              </table>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Creator</label>
                <p className="text-sm text-gray-900">{selectedForm.creator}</p>
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
