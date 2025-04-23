import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Event } from '@/lib/models/eventModel';

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find({}).sort({ name: 1 });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, fee } = await request.json();
    
    if (!name || fee === undefined) {
      return NextResponse.json({ error: 'Name and fee are required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Check if event already exists
    const existingEvent = await Event.findOne({ name });
    if (existingEvent) {
      return NextResponse.json({ error: 'Event already exists' }, { status: 409 });
    }
    
    const newEvent = await Event.create({ name, fee });
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
} 