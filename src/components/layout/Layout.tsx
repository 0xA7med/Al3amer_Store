import React from 'react'
import Header from './Header'
import Footer from './Footer'
import { SearchProvider } from '@/contexts/SearchContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SearchProvider>
      <div className="min-h-screen flex flex-col rtl font-arabic">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </SearchProvider>
  )
}

export default Layout
