import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  fee: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participantName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  institutionName: {
    type: String,
    required: false,
    trim: true
  },
  tokenNumber: {
    type: String,
    required: true,
    unique: true
  },
  paid: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Generate models only if they don't exist
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);

export { Event, Registration }; 