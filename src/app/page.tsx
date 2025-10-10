'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Shield, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Image
              src="/zte-customers-support/zte-logo.svg"
              alt="ZTE Logo"
              width={100}
              height={40}
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Viettel Technical Support System</h1>
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
              <h2 className="text-lg font-semibold text-gray-900">Submit Ticket</h2>
              <p className="text-gray-600 text-sm">Fill out a new ticket as a regular user</p>
            </div>
          </Link>
          
          <Link 
            href="/user/dashboard"
            className="w-full bg-white hover:bg-gray-100 border border-gray-200 rounded-lg p-6 flex items-center space-x-4 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
              <p className="text-gray-600 text-sm">View and manage your submitted tickets</p>
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
              <p className="text-gray-600 text-sm">Manage tickets and view submissions</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Viettel Overseas Markets
          </p>
        </div>
      </div>
    </div>
  )
}