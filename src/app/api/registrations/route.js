import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Registration, Event } from '@/lib/models/eventModel';

// Improved token generation function
async function generateUniqueToken() {
  try {
    // Find the highest token number
    const latestRegistration = await Registration.findOne({}, { tokenNumber: 1 })
      .sort({ tokenNumber: -1 });
    
    if (latestRegistration && latestRegistration.tokenNumber) {
      // Extract the numeric part of the last token (CF-####)
      const lastTokenNumber = latestRegistration.tokenNumber;
      const numericPart = parseInt(lastTokenNumber.split('-')[1]);
      
      // Increment the number and format
      const newNumber = numericPart + 1;
      return `CF-${newNumber.toString().padStart(4, '0')}`;
    } else {
      // No registrations exist, start from 1
      return 'CF-0001';
    }
  } catch (error) {
    console.error('Error generating token:', error);
    // Fallback to timestamp-based token
    const timestamp = Date.now();
    return `CF-${timestamp.toString().slice(-4)}`;
  }
}

// Fallback token function
async function generateFallbackToken() {
  // Use current time + random number to ensure uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `CF-${timestamp.toString().slice(-4)}${random.toString().padStart(3, '0')}`;
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
    
    // Generate token based on the highest token number
    let tokenNumber = await generateUniqueToken();
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
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
        // If duplicate key error
        if (err.code === 11000) {
          console.log(`Token conflict with ${tokenNumber}, retrying...`);
          retries++;
          
          // Switch to fallback token generation on retry
          tokenNumber = await generateFallbackToken();
          continue;
        }
        
        throw err;
      }
    }
    
    // If we've reached here, all retries failed
    return NextResponse.json({ 
      error: 'Couldn\'t generate a unique token after multiple attempts. Please try again later.' 
    }, { status: 500 });
    
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