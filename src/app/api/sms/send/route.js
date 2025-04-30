import { NextResponse } from 'next/server';

// SMS API configuration
const SMS_API_KEY = 'XAAPz7cGWvHami0JHN67';
const SMS_SENDER_ID = '8809617614175';
const SMS_API_URL = 'http://bulksmsbd.net/api/smsapi';

export async function POST(request) {
  try {
    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Phone number and message are required' 
      }, { status: 400 });
    }
    
    // Format phone number (ensure it starts with 880)
    let formattedPhone = phone;
    if (phone.startsWith('+')) {
      formattedPhone = phone.substring(1);
    }
    if (!formattedPhone.startsWith('880')) {
      // Assuming Bangladesh numbers, convert local format to international
      if (formattedPhone.startsWith('0')) {
        formattedPhone = `88${formattedPhone}`;
      } else {
        formattedPhone = `880${formattedPhone}`;
      }
    }
    
    // Prepare the SMS API request
    const formData = new URLSearchParams();
    formData.append('api_key', SMS_API_KEY);
    formData.append('senderid', SMS_SENDER_ID);
    formData.append('number', formattedPhone);
    formData.append('message', message);
    
    // Send the request to the SMS API
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const responseData = await response.json().catch(() => ({ response_code: 0, error_message: 'Invalid API response' }));
    
    // Check for success - response codes may vary, check documentation
    if (responseData.response_code === 1003 || responseData.error_message) {
      return NextResponse.json({ 
        error: responseData.error_message || 'Failed to send SMS' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      details: responseData
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ 
      error: 'Failed to send SMS. Please try again.' 
    }, { status: 500 });
  }
} 