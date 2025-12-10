'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Upload, Clock, X, File } from 'lucide-react'

const formSchema = z.object({
  operator: z.string().min(1, 'Operator is required'),
  country: z.string().optional(),
  issue: z.string().min(1, 'Issue is required'),
  issue_description: z.string().min(1, 'Issue description is required'),
  kpis_affected: z.string().min(1, 'KPIs affected is required'),
  counter_evaluation: z.string().min(1, 'Counter evaluation is required'),
  optimization_actions: z.string().min(1, 'Optimization actions is required'),
  priority: z.string().min(1, 'Priority is required'),
  start_time: z.string().min(1, 'Start time is required'),
  creator: z.string().min(1, 'Creator is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
})

const operatorCountryMap: Record<string, string> = {
  'Bitel': 'Peru',
  'Natcom': 'Haiti', 
  'Nexttel': 'Cameroon',
  'Lumitel': 'Burundi',
  'Movitel': 'Mozambique',
  'Halotel': 'Tanzania',
  'Unitel': 'Laos',
  'Mytel': 'Myanmar',
  'Telemor': 'East Timor',
  'Metfone': 'Cambodia'
}

export default function FormSubmitTab() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(formSchema)
  })

  const selectedOperator = watch('operator')
  
  // Auto-fill country based on operator
  useEffect(() => {
    if (selectedOperator && operatorCountryMap[selectedOperator]) {
      setValue('country', operatorCountryMap[selectedOperator])
    }
  }, [selectedOperator, setValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      const maxFiles = 10 // Maximum 10 files
      
      // Check total number of files
      if (selectedFiles.length + files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed. You currently have ${selectedFiles.length} files selected.`)
        e.target.value = ''
        return
      }
      
      // Validate each file
      const validFiles: File[] = []
      for (const file of files) {
        if (file.size > maxSize) {
          alert(`File "${file.name}" is too large. Maximum allowed size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
          continue
        }
        validFiles.push(file)
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles])
      }
      
      e.target.value = '' // Clear the input
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error } = await supabase.storage
        .from('form-attachments')
        .upload(fileName, file)
      
      if (error) {
        throw error
      }
      
      const { data } = supabase.storage
        .from('form-attachments')
        .getPublicUrl(fileName)
      
      return data.publicUrl
    })
    
    return Promise.all(uploadPromises)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    try {
      let fileUrls: string[] = []
      
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFiles(selectedFiles)
      }
      
      const country = operatorCountryMap[data.operator] || ''
      const now = new Date()
      // Generate form_id (ticket ID)
      const dateString = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
      const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0') // Random 3 số (000-999)
      const formId = `${country}-${dateString}-${randomNumber}` // Format: Peru-20241010-123
      
      const { error } = await supabase
        .from('forms')
        .insert({
          ...data,
          form_id: formId,
          country,
          file_url: fileUrls.length > 0 ? fileUrls : null,
          status: 'Inprocess'
        })
      
      if (error) {
        throw error
      }
      
      // Store user info for dashboard access
      localStorage.setItem('userEmail', data.creator)
      localStorage.setItem('userPhone', data.phone_number)
      
      alert(`Ticket submitted successfully! Ticket ID: ${formId}`)
      
      // Reset form
      reset()
      setSelectedFiles([])
      
      // Optionally switch to tickets tab
      // You can add a callback prop to switch tabs if needed
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Submit New Ticket</h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mt-1 sm:mt-1.5">Fill out all required fields to submit your ticket</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-curved-lg shadow-light p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-5 pb-2 border-b border-gray-200">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Operator */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Operator <span className="text-red-500">*</span>
              </label>
              <select
                {...register('operator')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
              >
                <option value="">Select operator</option>
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
              {errors.operator && (
                <p className="text-red-500 text-sm mt-1">{errors.operator.message}</p>
              )}
            </div>

            {/* Country (Auto-filled) */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">Country</label>
              <input
                type="text"
                value={selectedOperator ? operatorCountryMap[selectedOperator] || '' : ''}
                readOnly
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-gray-100 text-gray-900"
                placeholder="Auto-filled based on operator"
              />
            </div>

            {/* Issue Name - Full width */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Issue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('issue')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
                placeholder="Enter the issue name"
              />
              {errors.issue && (
                <p className="text-red-500 text-sm mt-1">{errors.issue.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Description Details */}
        <div className="bg-white rounded-curved-lg shadow-light p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-5 pb-2 border-b border-gray-200">
            Description Details
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('issue_description')}
                rows={4}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light resize-none"
                placeholder="Describe the issue in detail..."
              />
              {errors.issue_description && (
                <p className="text-red-500 text-sm mt-1">{errors.issue_description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Affected KPIs <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('kpis_affected')}
                rows={4}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light resize-none"
                placeholder="List affected KPIs..."
              />
              {errors.kpis_affected && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.kpis_affected.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Counter Evaluation <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('counter_evaluation')}
                rows={4}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light resize-none"
                placeholder="Enter counter evaluation..."
              />
              {errors.counter_evaluation && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.counter_evaluation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Action You Tried but Not Resolved <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('optimization_actions')}
                rows={4}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light resize-none"
                placeholder="List optimization actions taken..."
              />
              {errors.optimization_actions && (
                <p className="text-red-500 text-sm mt-1">{errors.optimization_actions.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Additional Information */}
        <div className="bg-white rounded-curved-lg shadow-light p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-5 pb-2 border-b border-gray-200">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Priority */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priority')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
              >
                <option value="">Select priority</option>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
              {errors.priority && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.priority.message}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Issue Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('start_time')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
              />
              {errors.start_time && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.start_time.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone_number')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
                placeholder="Enter your phone number"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            {/* Email - Full width on mobile, spans 2 cols on larger screens */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('creator')}
                className="w-full border border-gray-300 rounded-curved px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 shadow-light"
                placeholder="Enter your email address"
              />
              {errors.creator && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.creator.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: File Upload */}
        <div className="bg-white rounded-curved-lg shadow-light p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-5 pb-2 border-b border-gray-200">
            Attachments (Optional)
          </h3>
          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 sm:mb-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-curved p-2 sm:p-3 md:p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <File className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-curved hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-2 border-dashed border-gray-300 rounded-curved-lg p-4 sm:p-6 md:p-8 lg:p-10 text-center hover:border-blue-400 transition-all duration-300 shadow-light hover:shadow-light-md bg-gray-50">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.zip,.rar"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-700 mb-1">
                {selectedFiles.length > 0 
                  ? `Add more files (${selectedFiles.length}/10 selected)`
                  : 'Click to upload files'
                }
              </p>
              <p className="text-xs sm:text-sm md:text-base text-gray-500">
                PDF, DOC, TXT, JPG, PNG, XLS, XLSX, CSV, ZIP, RAR (max 50MB each, up to 10 files)
              </p>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-curved-lg shadow-light p-4 sm:p-5 md:p-6 lg:p-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 sm:py-3 md:py-4 lg:py-5 px-4 sm:px-6 md:px-8 rounded-curved-lg transition-all duration-300 flex items-center justify-center shadow-light hover:shadow-light-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg lg:text-xl"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

