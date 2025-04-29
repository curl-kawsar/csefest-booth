import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Registration, Event } from '@/lib/models/eventModel';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    await connectToDatabase();
    
    // Build the date filter query
    let dateQuery = {};
    
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateQuery = { 
        createdAt: { 
          $gte: today, 
          $lt: tomorrow 
        } 
      };
    } 
    else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      dateQuery = { 
        createdAt: { 
          $gte: yesterday, 
          $lt: today 
        } 
      };
    } 
    else if (dateFilter === 'thisWeek') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      dateQuery = { 
        createdAt: { 
          $gte: weekStart
        } 
      };
    } 
    else if (dateFilter === 'thisMonth') {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      dateQuery = { 
        createdAt: { 
          $gte: monthStart
        } 
      };
    } 
    else if (dateFilter === 'custom' && startDate && endDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      dateQuery = { 
        createdAt: { 
          $gte: startDateTime, 
          $lte: endDateTime 
        } 
      };
    }
    
    // Get registrations with event details and apply date filter
    const registrations = await Registration.find({ 
      paid: true,
      ...dateQuery
    })
      .populate('eventId')
      .lean();
    
    // Group by event and calculate totals
    const eventSummary = {};
    let totalAmount = 0;
    
    registrations.forEach(reg => {
      if (!reg.eventId) return; // Skip if event data is missing
      
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
      totalAmount,
      dateFilter,
      dateRange: dateFilter === 'custom' ? { startDate, endDate } : null
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating finance summary:', error);
    return NextResponse.json({ error: 'Failed to generate finance summary' }, { status: 500 });
  }
} 