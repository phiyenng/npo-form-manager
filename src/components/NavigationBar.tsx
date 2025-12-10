'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, FileText, Shield } from 'lucide-react'
import { ReactNode } from 'react'

interface NavigationBarProps {
  activeTab?: 'submit' | 'tickets'
  onTabChange?: (tab: 'submit' | 'tickets') => void
  showTabs?: boolean
  rightActions?: ReactNode
}

export default function NavigationBar({ activeTab, onTabChange, showTabs = true, rightActions }: NavigationBarProps) {
  const router = useRouter()

  return (
    <nav className="bg-white shadow-light border-b sticky top-0 z-40">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20 xl:h-24">
          {/* Left: Logo | Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5">
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              <Image
                src="/zte-customers-support/viettel-logo.svg"
                alt="Viettel Logo"
                width={120}
                height={32}
                className="h-5 sm:h-6 md:h-7 lg:h-8 xl:h-9 w-auto"
              />
              <Image
                src="/zte-customers-support/zte-logo.svg"
                alt="ZTE Logo"
                width={80}
                height={32}
                className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 w-auto"
              />
            </div>
            <div className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 leading-tight">
                Viettel Technical Support System
              </h1>
              <p className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-600 hidden sm:block">
                Viettel Overseas Markets
              </p>
            </div>
          </div>

          {/* Right: Navigation Buttons or Custom Actions */}
          {rightActions ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              {rightActions}
            </div>
          ) : showTabs ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              <button
                onClick={() => onTabChange?.('submit')}
                className={`px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-curved flex items-center space-x-1.5 sm:space-x-2 transition-all duration-300 shadow-light hover:shadow-light-md text-xs sm:text-sm md:text-base lg:text-base ${
                  activeTab === 'submit'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Submit Ticket</span>
                <span className="sm:hidden">Submit</span>
              </button>
              
              <button
                onClick={() => onTabChange?.('tickets')}
                className={`px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-curved flex items-center space-x-1.5 sm:space-x-2 transition-all duration-300 shadow-light hover:shadow-light-md text-xs sm:text-sm md:text-base lg:text-base ${
                  activeTab === 'tickets'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">My Tickets</span>
                <span className="sm:hidden">Tickets</span>
              </button>

              <button
                onClick={() => router.push('/admin')}
                className="px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-curved flex items-center space-x-1.5 sm:space-x-2 transition-all duration-300 shadow-light hover:shadow-light-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm md:text-base lg:text-base"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

