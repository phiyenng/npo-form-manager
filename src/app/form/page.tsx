'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Upload, Clock, X, File } from 'lucide-react'
import Link from 'next/link'

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

export default function FormPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
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
          form_id: formId, // Thêm form_id được generate
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
      router.push('/user/dashboard')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Submit New Form</h1>
          <p className="text-gray-600 mt-1">Fill out all required fields to submit your form</p>
          
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator <span className="text-red-500">*</span>
            </label>
            <select
              {...register('operator')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={selectedOperator ? operatorCountryMap[selectedOperator] || '' : ''}
              readOnly
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-900"
              placeholder="Auto-filled based on operator"
            />
          </div>

          {/* Issue Name*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('issue')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter the issue"
            />
            {errors.issue && (
              <p className="text-red-500 text-sm mt-1">{errors.issue.message}</p>
            )}
          </div>

          {/* Description Area */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('issue_description')}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Describe the issue in detail..."
              />
              {errors.issue_description && (
                <p className="text-red-500 text-sm mt-1">{errors.issue_description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affected KPIs<span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('kpis_affected')}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="List affected KPIs..."
              />
              {errors.kpis_affected && (
                <p className="text-red-500 text-sm mt-1">{errors.kpis_affected.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counter Evaluation<span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('counter_evaluation')}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter counter evaluation..."
              />
              {errors.counter_evaluation && (
                <p className="text-red-500 text-sm mt-1">{errors.counter_evaluation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action You Tried but Not Resolved<span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('optimization_actions')}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="List optimization actions taken..."
              />
              {errors.optimization_actions && (
                <p className="text-red-500 text-sm mt-1">{errors.optimization_actions.message}</p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dump/OSS KPIs Data</label>
            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <File className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.zip,.rar"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFiles.length > 0 
                    ? `Click to add more files (${selectedFiles.length}/10 selected)`
                    : 'Click to upload files'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, TXT, JPG, PNG, XLS, XLSX, CSV, ZIP, RAR (max 50MB each, up to 10 files)
                </p>
              </label>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              {...register('priority')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select priority</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>


          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('start_time')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('phone_number')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter your phone number"
            />
            {errors.phone_number && (
              <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
            )}
          </div>

          {/* Creator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('creator')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter your email address"
            />
            {errors.creator && (
              <p className="text-red-500 text-sm mt-1">{errors.creator.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
