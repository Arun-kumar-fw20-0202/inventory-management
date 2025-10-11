import { Card } from '@heroui/card'
import React from 'react'
import {
  User,
  Users,
  Calendar,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin
} from 'lucide-react'

export default function OrgCard({ org }) {
  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPhone = (phone) => {
    if (!phone) return 'N/A'
    return phone.replace(/(\d{5})(\d{5})/, '$1-$2')
  }

  const getInitials = (name) => {
    if (!name) return 'ORG'
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Component Sections
  const LogoSection = () => (
    <div className="relative">
      {org?.details?.logoUrl ? (
        <img 
          src={org?.details?.logoUrl} 
          alt={`${org?.name} logo`}
          className="h-24 w-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
        />
      ) : (
        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
          {getInitials(org?.name)}
        </div>
      )}
      <div className="absolute -bottom-2 -right-2 h-7 w-7 bg-emerald-500 rounded-full border-3 border-white shadow-md flex items-center justify-center">
        <div className="h-2 w-2 bg-white rounded-full"></div>
      </div>
    </div>
  )

  const HeaderSection = () => (
    <div className="flex-1 min-w-0">
      <h2 className="text-3xl font-bold mb-2 tracking-tight">
        {org?.name || 'Organization Name'}
      </h2>
      {org?.createdAt && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">
          <Calendar className="h-4 w-4" />
          <span>Established {formatDate(org?.createdAt)}</span>
        </div>
      )}
    </div>
  )

  const ContactDetails = () => {
    if (!org?.details) return null

    const contactItems = [
      { icon: Mail, value: org?.details?.email, color: 'text-white' },
      { icon: Phone, value: formatPhone(org?.details?.phone), color: 'text-white' },
      { icon: Globe, value: org?.details?.website, color: 'text-white' }
    ]

    return (
      <div className="bg-default rounded-xl p-6 border border-default">
        <h3 className="text-lg font-semibold  mb-4 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {contactItems.map((item, index) => 
            item?.value && item?.value !== 'N/A' ? (
              <div key={index} className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 flex-shrink-0`} />
                <span className="text-sm truncate">{item?.value}</span>
              </div>
            ) : null
          )}
          
            {org?.details?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{org?.details?.address} , {org?.details?.city && `${org?.details?.city}`}
                {/* zipcode */}
                {org?.details?.zip && ` - ${org?.details?.zip}`}
                {/* state */}
                {org?.details?.state && `, ${org?.details?.state}`}
                {/* country */}
                {org?.details?.country && `, ${org?.details?.country}`}
                </span>
              </div>
            )}
        </div>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, label, value, gradient }) => (
    <div className={`relative overflow-hidden rounded-xl p-5 bg-gradient-to-br ${gradient} text-white shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className="relative z-10">
        <Icon className="h-8 w-8 mb-3 opacity-90 group-hover:scale-110 transition-transform" />
        <p className="text-xs font-medium opacity-90 mb-1 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="absolute top-0 right-0 opacity-10">
        <Icon className="h-24 w-24 transform translate-x-6 -translate-y-6" />
      </div>
    </div>
  )

  const StatsGrid = () => {
    const stats = [
      { icon: User, label: 'Admins', value: org?.users || 0, gradient: 'from-blue-500 to-blue-600' },
      { icon: Users, label: 'Managers', value: org?.managers || 0, gradient: 'from-emerald-500 to-emerald-600' },
      { icon: Users, label: 'Staff', value: org?.stafs || 0, gradient: 'from-purple-500 to-purple-600' },
      { icon: Calendar, label: 'Validity', value: org?.validityMonths ? `${org?.validityMonths}m` : '-', gradient: 'from-orange-500 to-red-500' }
    ]

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    )
  }

  const BusinessTags = () => {
    if (!org?.details?.businessType) return null

    const tags = [
      { label: org?.details?.businessType, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      org?.details?.industry && { label: org?.details?.industry, color: 'bg-pink-50 text-pink-700 border-pink-200' },
      org?.details?.currency && { label: org?.details?.currency, color: 'bg-amber-50 text-amber-700 border-amber-200' }
    ].filter(Boolean)

    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border ${tag.color} transition-all hover:scale-105`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    )
  }

  // Main Render
  return (
    <Card className="overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-default">
      <div className="p-8">
        {/* Header with Logo */}
        <div className="flex items-start gap-6 mb-8">
          <LogoSection />
          <HeaderSection />
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <ContactDetails />
        </div>

        {/* Statistics Grid */}
        <div className="mb-8">
          <StatsGrid />
        </div>

        {/* Business Tags */}
        <BusinessTags />
      </div>
    </Card>
  )
}