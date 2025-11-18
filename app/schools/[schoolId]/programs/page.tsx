import { notFound } from 'next/navigation'
import { getSchool, getPrograms } from '@/lib/school-data'
import { ProgramList } from '@/components/schools/program-list'

export default async function ProgramListPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const school = getSchool(schoolId)
  const programs = getPrograms(schoolId)

  if (!school) {
    notFound()
  }

  return <ProgramList school={school} programs={programs} />
}

