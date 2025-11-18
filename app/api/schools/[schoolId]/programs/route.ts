import { NextResponse } from 'next/server'
import { getPrograms } from '@/lib/school-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params
    const programs = getPrograms(schoolId)
    return NextResponse.json({ success: true, data: programs })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch programs' } },
      { status: 500 }
    )
  }
}

