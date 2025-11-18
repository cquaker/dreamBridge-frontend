import { NextResponse } from 'next/server'
import { getProgram } from '@/lib/school-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string; programId: string }> }
) {
  try {
    const { schoolId, programId } = await params
    const program = getProgram(schoolId, decodeURIComponent(programId))
    if (!program) {
      return NextResponse.json(
        { success: false, error: { message: 'Program not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: program })
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch program' } },
      { status: 500 }
    )
  }
}

