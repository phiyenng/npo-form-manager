'use client'

import { useState } from 'react'
import FormSubmitTab from '@/components/FormSubmitTab'
import MyTicketsTab from '@/components/MyTicketsTab'
import NavigationBar from '@/components/NavigationBar'

type TabType = 'submit' | 'tickets'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('submit')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} showTabs={true} />

      {/* Tab Content */}
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12">
        {activeTab === 'submit' && <FormSubmitTab />}
        {activeTab === 'tickets' && <MyTicketsTab />}
      </div>
    </div>
  )
}
