import express from 'express';
import Faculty from '../models/Faculty.js';

const router = express.Router();

// GET all faculty
router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single faculty
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create faculty
router.post('/', async (req, res) => {
  console.log('Backend: POST /api/faculty received');
  console.log('Backend: Request body:', req.body);
  try {
    const faculty = new Faculty(req.body);
    const savedFaculty = await faculty.save();
    console.log('Backend: Faculty saved successfully:', savedFaculty);
    res.status(201).json(savedFaculty);
  } catch (error) {
    console.error('Backend: Error saving faculty:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// PUT update faculty
router.put('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE faculty
router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
