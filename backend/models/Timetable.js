import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  schedule: [{
    day: String,
    slot: Number,
    subject_name: String,
    subject_code: String,
    faculty_name: String,
    room_name: String,
    room_type: String,
    is_lab: Boolean,
    lab_name: String,
    lab_slot: String
  }],
  semester: String,
  department: String,
  program: String,
  section: String,
  roomNo: String,
  shift: String,
  conflicts: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to convert _id to id for frontend compatibility
timetableSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Timetable', timetableSchema);
