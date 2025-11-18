import { NextResponse } from 'next/server'
import { getAllSchools } from '@/lib/school-data'

export async function GET() {
  try {
    const schools = getAllSchools()
    return NextResponse.json({ success: true, data: schools })
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch schools' } },
      { status: 500 }
    )
  }
}

