import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer']
  },
  total_hours_per_week: {
    type: Number,
    default: 20
  },
  academic_mappings: [{
    course: String,
    year: String,
    semester: String,
    section: String
  }],
  available_slots: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to convert _id to id for frontend compatibility
facultySchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Faculty', facultySchema);
