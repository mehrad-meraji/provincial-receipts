'use client'

import { useParams, useRouter } from 'next/navigation'
import PersonForm from '../../components/PersonForm'

export default function PersonEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const editingId = id === 'new' ? null : id

  return (
    <PersonForm
      editingId={editingId}
      onClose={() => router.push('/admin')}
      onSaved={() => router.push('/admin')}
    />
  )
}
