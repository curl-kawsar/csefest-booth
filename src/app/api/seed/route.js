import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Event } from '@/lib/models/eventModel';

const events = [
  { name: 'Hackathon', fee: 1500 },
  { name: 'IUPC', fee: 600 },
  { name: 'Typing Speed Contest', fee: 100 },
  { name: 'E-Football', fee: 200 },
  { name: 'ICT QUIZ', fee: 50 }
];

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check if events already exist
    const existingCount = await Event.countDocuments();
    
    if (existingCount > 0) {
      return NextResponse.json({ 
        message: `Database already seeded with ${existingCount} events` 
      });
    }
    
    // Insert all events
    await Event.insertMany(events);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${events.length} events`
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
} 