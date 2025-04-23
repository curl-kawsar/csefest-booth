// Bluetooth POS integration utility
// Note: Web Bluetooth API is only available in secure contexts (HTTPS) and specific browsers
import { render } from 'react-thermal-printer';

// Debug logging function
const debugLog = (message, ...args) => {
  console.log(`[Bluetooth Debug] ${message}`, ...args);
};

// More accurate browser detection
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  debugLog('User Agent:', userAgent);
  
  return {
    isChrome: /chrome|crios/i.test(userAgent),
    isAndroid: /android/i.test(userAgent),
    isIOS: /iphone|ipad|ipod/i.test(userAgent),
    isMobile: /mobile|android|iphone|ipad|ipod/i.test(userAgent),
    version: userAgent.match(/(chrome|crios)\/(\d+)/i)?.[2] || 'unknown'
  };
};

// Helper function to delay connection attempts
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Common Bluetooth Service UUIDs
const BLUETOOTH_SERVICES = {
  GENERIC_ACCESS: '00001800-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
  BATTERY: '0000180f-0000-1000-8000-00805f9b34fb',
  HID: '00001812-0000-1000-8000-00805f9b34fb',
  PRINTER: {
    ESCPOS: '000018f0-0000-1000-8000-00805f9b34fb',
    SERIAL: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    THERMAL: '0000fe5f-0000-1000-8000-00805f9b34fb',
    COMMON1: '0000fff0-0000-1000-8000-00805f9b34fb',
    COMMON2: '0000ffe0-0000-1000-8000-00805f9b34fb',
    COMMON3: '0000ffd0-0000-1000-8000-00805f9b34fb'
  }
};

// Helper function to generate printer commands
const printerCommands = {
  // Initialize printer
  INIT: new Uint8Array([0x1B, 0x40]),
  // Cut paper (partial cut)
  CUT: new Uint8Array([0x1D, 0x56, 0x01]),
  // Full cut
  FULL_CUT: new Uint8Array([0x1D, 0x56, 0x00]),
  // Feed and cut (feed N lines then cut)
  FEED_AND_CUT: (lines = 3) => new Uint8Array([0x1B, 0x64, lines, 0x1D, 0x56, 0x01]),
  // Line feed
  LINE_FEED: new Uint8Array([0x0A]),
  // Carriage return
  CR: new Uint8Array([0x0D]),
  // Feed lines
  FEED_LINES: (lines) => new Uint8Array([0x1B, 0x64, lines]),
  // Text formatting - Bold ON
  BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
  // Text formatting - Bold OFF
  BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
  // Center alignment
  ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
  // Left alignment
  ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
  // Right alignment
  ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02])
};

// Helper function to check Bluetooth availability
async function checkBluetoothAvailability() {
  debugLog('Checking Bluetooth availability...');
  debugLog('navigator.bluetooth exists:', !!navigator.bluetooth);
  
  // Check if running in secure context
  if (!window.isSecureContext) {
    throw new Error('Web Bluetooth requires a secure context (HTTPS). Please ensure you are using HTTPS.');
  }

  // First check if the Web Bluetooth API exists
  if (!navigator.bluetooth) {
    if (getBrowserInfo().isIOS) {
      throw new Error('Web Bluetooth is not supported on iOS devices. Please use an Android device with Chrome browser.');
    } else if (getBrowserInfo().isMobile && !getBrowserInfo().isChrome) {
      throw new Error('Please use Chrome browser on Android for Bluetooth functionality.');
    } else if (getBrowserInfo().isChrome && parseInt(getBrowserInfo().version) < 56) {
      throw new Error('Please update your Chrome browser to version 56 or higher to use Bluetooth features.');
    } else {
      throw new Error('Web Bluetooth API is not supported in your browser. Please use Chrome, Edge, or Opera.');
    }
  }

  try {
    debugLog('Checking Bluetooth adapter...');
    
    // Check if Bluetooth is available and enabled
    if (navigator.bluetooth.getAvailability) {
      const isBluetoothAvailable = await navigator.bluetooth.getAvailability();
      debugLog('Bluetooth availability:', isBluetoothAvailable);
      
      if (!isBluetoothAvailable) {
        throw new Error('Bluetooth is not available or enabled on your device. Please enable Bluetooth and try again.');
      }
    }

    // Additional check for Android permissions
    if (getBrowserInfo().isAndroid && getBrowserInfo().isChrome) {
      debugLog('Checking Android permissions...');
      try {
        if ('permissions' in navigator) {
          const permissionStatus = await navigator.permissions.query({ name: 'bluetooth' });
          debugLog('Bluetooth permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            throw new Error('Bluetooth permission denied. Please grant Bluetooth permission in your browser settings.');
          }
        } else {
          debugLog('Permissions API not available');
        }
      } catch (permError) {
        debugLog('Permission check error:', permError);
        // Only throw if it's a permission denied error
        if (permError.message.includes('denied')) {
          throw permError;
        }
      }
    }

    debugLog('Bluetooth availability check passed');
  } catch (error) {
    debugLog('Bluetooth availability check failed:', error);
    throw error;
  }
}

export async function connectToBluetoothDevice() {
  try {
    await checkBluetoothAvailability();

    // Request device with more permissive filters and optional services
    const device = await navigator.bluetooth.requestDevice({
      // Accept devices that advertise any service
      acceptAllDevices: true,
      optionalServices: [
        BLUETOOTH_SERVICES.GENERIC_ACCESS,
        BLUETOOTH_SERVICES.DEVICE_INFO,
        BLUETOOTH_SERVICES.BATTERY,
        BLUETOOTH_SERVICES.HID,
        BLUETOOTH_SERVICES.PRINTER.ESCPOS,
        BLUETOOTH_SERVICES.PRINTER.SERIAL,
        BLUETOOTH_SERVICES.PRINTER.THERMAL,
        BLUETOOTH_SERVICES.PRINTER.COMMON1,
        BLUETOOTH_SERVICES.PRINTER.COMMON2,
        BLUETOOTH_SERVICES.PRINTER.COMMON3
      ]
    });

    if (!device) {
      throw new Error('No device selected');
    }

    console.log('Device selected:', device.name);

    // For mobile devices, add a small delay before connecting
    if (getBrowserInfo().isMobile) {
      await delay(1000);
    }

    // Implement connection retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let server = null;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        if (!device.gatt) {
          throw new Error('GATT server not available');
        }

        if (device.gatt.connected) {
          console.log('Already connected to GATT server');
          server = device.gatt;
          break;
        }

        server = await device.gatt.connect();
        console.log('Connected to GATT server');
        break;
      } catch (error) {
        lastError = error;
        retryCount++;
        console.log(`Connection attempt ${retryCount} failed:`, error);
        
        if (retryCount === maxRetries) {
          throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await delay(2000); // Increased delay between retries
      }
    }

    if (!server) {
      throw lastError || new Error('Failed to establish connection');
    }

    // Get device information if available
    try {
      const deviceInfoService = await server.getPrimaryService(BLUETOOTH_SERVICES.DEVICE_INFO);
      if (deviceInfoService) {
        const characteristics = await deviceInfoService.getCharacteristics();
        
        for (const characteristic of characteristics) {
          try {
            const value = await characteristic.readValue();
            const decodedValue = new TextDecoder().decode(value);
            console.log(`Device info - ${characteristic.uuid}:`, decodedValue);
          } catch (error) {
            console.log(`Couldn't read characteristic ${characteristic.uuid}`);
          }
        }
      }
    } catch (error) {
      console.log('Device information not available:', error.message);
    }

    // Add disconnect listener with reconnection logic
    device.addEventListener('gattserverdisconnected', async () => {
      console.log('Device disconnected');
      
      // Attempt to reconnect
      try {
        server = await device.gatt.connect();
        console.log('Reconnected to GATT server');
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    });
    
    return { device, server };
  } catch (error) {
    console.error('Bluetooth connection error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('User cancelled')) {
      throw new Error('Connection cancelled by user');
    } else if (error.message.includes('Device not found')) {
      throw new Error('Device not found or out of range');
    } else if (error.message.includes('Bluetooth adapter not available')) {
      throw new Error('Please enable Bluetooth on your device');
    } else if (error.message.includes('GATT operation failed')) {
      throw new Error('Connection failed. Please try again or restart your device');
    } else {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }
}

export async function disconnectFromDevice(device) {
  if (device && device.gatt.connected) {
    try {
      device.gatt.disconnect();
      console.log('Disconnected from device');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
}

// Simplified plain-text-based receipt generator
export function generateRegistrationReceipt(registration) {
  const { eventId, participantName, tokenNumber } = registration;
  
  let text = '';
  
  // Header - center aligned
  text += `BAIUST INTRA CSE FEST\n`;
  text += `--------------------------------\n`;
  
  // Token - centered and bold
  text += `TOKEN: ${tokenNumber}\n`;
  text += `--------------------------------\n`;
  
  // Participant info
  text += `Participant: ${participantName}\n`;
  text += `Event: ${eventId.name}\n`;
  text += `Fee: ${eventId.fee} BDT\n`;
  text += `--------------------------------\n`;
  
  // Date and time
  const now = new Date();
  const dateStr = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  text += `Date: ${dateStr}    Time: ${timeStr}\n`;

  
  // Footer
  text += `================================\n`;
  text += `PAID\n`;
  text += `================================\n`;
  text += `Enter the Token Number\nDuring Online Registration\n`;
  text += `--------------------------------\n`;
  text += `Thank you for participating!\n`;
  text += `Best Of Luck\n`;
  text += `Organized by Dept. Of CSE\n`;

  
  return text;
}

export async function printRegistrationReceipt(server, registration) {
  if (!server) {
    throw new Error('No printer connection');
  }
  
  try {
    const receiptText = generateRegistrationReceipt(registration);
    
    // Convert text to printer commands
    const encoder = new TextEncoder();
    const textData = encoder.encode(receiptText);
    
    // Combine with printer commands
    const printerData = new Uint8Array([
      ...printerCommands.INIT,
      ...printerCommands.ALIGN_CENTER,
      ...textData,
      ...printerCommands.ALIGN_LEFT,
      ...printerCommands.FEED_AND_CUT(3)
    ]);
    
    // Send to printer
    return await sendToPrinter(server, printerData);
  } catch (error) {
    console.error('Error printing registration receipt:', error);
    throw error;
  }
}

export async function sendToPrinter(server, printerData) {
  if (!server) {
    throw new Error('No GATT server connection');
  }

  try {
    // Try to find available services
    const services = await server.getPrimaryServices();
    console.log('Available services:', services.map(s => s.uuid));

    let printerService;
    // Try different known printer service UUIDs
    const printerServiceUUIDs = [
      BLUETOOTH_SERVICES.PRINTER.ESCPOS,
      BLUETOOTH_SERVICES.PRINTER.SERIAL,
      BLUETOOTH_SERVICES.PRINTER.THERMAL,
      BLUETOOTH_SERVICES.PRINTER.COMMON1,
      BLUETOOTH_SERVICES.PRINTER.COMMON2,
      BLUETOOTH_SERVICES.PRINTER.COMMON3
    ];

    for (const uuid of printerServiceUUIDs) {
      try {
        printerService = await server.getPrimaryService(uuid);
        if (printerService) {
          console.log('Found printer service:', uuid);
          break;
        }
      } catch (error) {
        console.log(`Service ${uuid} not found`);
      }
    }

    if (!printerService && services.length > 0) {
      // If no known service is found, try each available service
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          const writableChar = characteristics.find(char => 
            char.properties.write || char.properties.writeWithoutResponse
          );
          if (writableChar) {
            printerService = service;
            console.log('Found potential printer service:', service.uuid);
            break;
          }
        } catch (error) {
          console.log(`Error checking service ${service.uuid}:`, error);
        }
      }
    }

    if (!printerService) {
      throw new Error('No suitable printer service found');
    }

    // Get all characteristics of the service
    const characteristics = await printerService.getCharacteristics();
    console.log('Available characteristics:', characteristics.map(c => c.uuid));

    // Find a writable characteristic
    const writableCharacteristic = characteristics.find(char => 
      char.properties.write || char.properties.writeWithoutResponse
    );

    if (!writableCharacteristic) {
      throw new Error('No writable characteristic found');
    }
    
    // Write data to the printer in smaller chunks
    const CHUNK_SIZE = 50; // Reduced chunk size for more reliable transmission
    const MAX_RETRIES = 3;
    
    for (let i = 0; i < printerData.length; i += CHUNK_SIZE) {
      const chunk = printerData.slice(i, i + CHUNK_SIZE);
      let retryCount = 0;
      let success = false;
      
      while (retryCount < MAX_RETRIES && !success) {
        try {
          if (writableCharacteristic.properties.writeWithoutResponse) {
            await writableCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await writableCharacteristic.writeValue(chunk);
          }
          success = true;
        } catch (error) {
          retryCount++;
          console.log(`Chunk write attempt ${retryCount} failed:`, error);
          
          if (retryCount === MAX_RETRIES) {
            throw error;
          }
          
          // Longer delay between retries
          await delay(1000); 
        }
      }
      
      // Add a larger delay between chunks
      await delay(300);
    }
    
    console.log('Data sent to printer successfully');
    return true;
  } catch (error) {
    console.error('Error sending data to printer:', error);
    throw error;
  }
} 
