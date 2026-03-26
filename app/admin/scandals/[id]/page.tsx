'use client'

import { useParams, useRouter } from 'next/navigation'
import ScandalForm from '../../components/ScandalForm'

export default function ScandalEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const scandalId = id === 'new' ? null : id

  return (
    <ScandalForm
      scandalId={scandalId}
      onClose={() => router.push('/admin')}
      onSaved={() => router.push('/admin')}
    />
  )
}
