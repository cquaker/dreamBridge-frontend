import { NextResponse } from 'next/server'
import { getSchool } from '@/lib/school-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params
    const school = getSchool(schoolId)
    if (!school) {
      return NextResponse.json(
        { success: false, error: { message: 'School not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: school })
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch school' } },
      { status: 500 }
    )
  }
}

