import { notFound } from 'next/navigation'
import { getSchool, getProgram } from '@/lib/school-data'
import { ProgramDetail } from '@/components/schools/program-detail'

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string; programId: string }>
}) {
  const { schoolId, programId } = await params
  const school = getSchool(schoolId)
  const program = getProgram(schoolId, decodeURIComponent(programId))

  if (!school || !program) {
    notFound()
  }

  return <ProgramDetail school={school} program={program} />
}

