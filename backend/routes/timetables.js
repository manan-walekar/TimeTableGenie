import express from 'express';
import Timetable from '../models/Timetable.js';

const router = express.Router();

// GET all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ createdAt: -1 });
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single timetable
router.get('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create timetable
router.post('/', async (req, res) => {
  try {
    const timetable = new Timetable(req.body);
    const savedTimetable = await timetable.save();
    res.status(201).json(savedTimetable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update timetable
router.put('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE timetable
router.delete('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
