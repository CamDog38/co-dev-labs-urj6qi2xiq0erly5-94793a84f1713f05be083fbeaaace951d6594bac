import { ReactNode } from 'react'
import PreviewFrame from './PreviewFrame'

interface TwoColumnLayoutProps {
  children: ReactNode
  showPreview?: boolean
  links?: any[]
  bio?: string
  theme?: string
}

export default function TwoColumnLayout({ children, showPreview = true, links = [], bio = '', theme = 'default' }: TwoColumnLayoutProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          {children}
        </div>
        {showPreview && (
          <div className="hidden lg:block sticky top-4">
            <PreviewFrame links={links} bio={bio} theme={theme} />
          </div>
        )}
      </div>
    </div>
  )
}