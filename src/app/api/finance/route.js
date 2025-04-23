import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Registration, Event } from '@/lib/models/eventModel';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all registrations with event details
    const registrations = await Registration.find({ paid: true })
      .populate('eventId')
      .lean();
    
    // Group by event and calculate totals
    const eventSummary = {};
    let totalAmount = 0;
    
    registrations.forEach(reg => {
      const eventName = reg.eventId.name;
      const eventFee = reg.eventId.fee;
      
      if (!eventSummary[eventName]) {
        eventSummary[eventName] = {
          count: 0,
          fee: eventFee,
          total: 0
        };
      }
      
      eventSummary[eventName].count += 1;
      eventSummary[eventName].total += eventFee;
      totalAmount += eventFee;
    });
    
    // Convert to array format for easy frontend consumption
    const summary = {
      events: Object.entries(eventSummary).map(([name, data]) => ({
        name,
        count: data.count,
        fee: data.fee,
        total: data.total
      })),
      totalRegistrations: registrations.length,
      totalAmount
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating finance summary:', error);
    return NextResponse.json({ error: 'Failed to generate finance summary' }, { status: 500 });
  }
} 