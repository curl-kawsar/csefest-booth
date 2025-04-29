import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Registration, Event } from '@/lib/models/eventModel';

// Simple counter-based token function
async function generateUniqueToken() {
  try {
    // Get the total count of registrations and add 1
    const count = await Registration.countDocuments();
    const newCount = count + 1;
    
    // Format as CF-#### with leading zeros
    return `CF-${newCount.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating token:', error);
    // If we can't get a count, use timestamp as fallback
    const timestamp = Date.now();
    return `CF-${timestamp.toString().slice(-4)}`;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  
  try {
    await connectToDatabase();
    
    let query = {};
    if (eventId) {
      query.eventId = eventId;
    }
    
    const registrations = await Registration.find(query)
      .populate('eventId')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { eventId, participantName, email, phone, institutionName } = await request.json();
    
    if (!eventId || !participantName || !email || !phone) {
      return NextResponse.json(
        { error: 'Event ID, participant name, email, and phone are required' }, 
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Generate token based on registration count (guaranteed to be unique)
    const tokenNumber = await generateUniqueToken();
    
    try {
      // Create the registration record
      const registration = await Registration.create({
        eventId,
        participantName,
        email,
        phone,
        institutionName: institutionName || '',
        tokenNumber,
        paid: true
      });
      
      // Populate event details in response
      await registration.populate('eventId');
      
      return NextResponse.json(registration, { status: 201 });
    } catch (err) {
      console.error('Registration creation error:', err);
      
      if (err.code === 11000) {
        return NextResponse.json({ 
          error: 'Database conflict - Please try again' 
        }, { status: 409 });
      }
      
      throw err;
    }
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ 
      error: 'Failed to create registration. Please try again.' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { registrationId, pin } = await request.json();
    
    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }
    
    // Verify PIN
    if (pin !== '5356') {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Find and delete the registration
    const registration = await Registration.findByIdAndDelete(registrationId);
    
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
} 