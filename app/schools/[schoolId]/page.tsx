import { notFound } from 'next/navigation'
import { getSchool } from '@/lib/school-data'
import { SchoolDetail } from '@/components/schools/school-detail'

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const school = getSchool(schoolId)

  if (!school) {
    notFound()
  }

  return <SchoolDetail school={school} />
}

