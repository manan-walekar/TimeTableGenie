import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  building: {
    type: String
  },
  capacity: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Lecture Hall', 'Lab', 'Seminar Room', 'Auditorium'],
    default: 'Lecture Hall'
  },
  has_projector: {
    type: Boolean,
    default: false
  },
  has_ac: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to convert _id to id for frontend compatibility
roomSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Room', roomSchema);
