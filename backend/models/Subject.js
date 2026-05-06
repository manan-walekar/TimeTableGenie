import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String
  },
  credits: {
    type: Number,
    default: 3
  },
  hours_per_week: {
    type: Number
  },
  type: {
    type: String,
    enum: ['Theory', 'Lab', 'Elective'],
    default: 'Theory'
  },
  academic_mappings: [{
    course: String,
    year: String,
    semester: String,
    section: String
  }],
  preferred_days: [String],
  preferred_slots: [Number]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to convert _id to id for frontend compatibility
subjectSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Subject', subjectSchema);
