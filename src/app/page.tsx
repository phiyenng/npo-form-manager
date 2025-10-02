'use client'

import Link from 'next/link'
import { Users, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NPO Form Manager</h1>
          <p className="text-gray-600">Choose how you want to access the system</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/form"
            className="w-full bg-white hover:bg-gray-100 border border-gray-200 rounded-lg p-6 flex items-center space-x-4 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Submit Form</h2>
              <p className="text-gray-600 text-sm">Fill out a new form as a regular user</p>
            </div>
          </Link>
          
          <Link 
            href="/admin"
            className="w-full bg-white hover:bg-gray-100 border border-gray-200 rounded-lg p-6 flex items-center space-x-4 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="bg-indigo-100 p-3 rounded-full">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
              <p className="text-gray-600 text-sm">Manage forms and view submissions</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secure form management system
          </p>
        </div>
      </div>
    </div>
  )
}