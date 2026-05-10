const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  const { title, slug, leetcodeUrl, difficulty, leetcodeTags, customTopics, initialFeeling } = req.body;

  let interval = 1;
  if (initialFeeling === 'Easy') interval = 3;
  else if (initialFeeling === 'Medium') interval = 2;
  else if (initialFeeling === 'Hard') interval = 1;

  try {
    let problem = await Problem.findOne({ userId: req.user._id, slug });
    
    if (problem) {
      if (customTopics && customTopics.length > 0) {
        problem.customTopics = [...new Set([...problem.customTopics, ...customTopics])];
      }
      await problem.save();
      return res.status(200).json(problem);
    }

    problem = await Problem.create({
      userId: req.user._id,
      title,
      slug,
      leetcodeUrl,
      difficulty,
      leetcodeTags: leetcodeTags || [],
      customTopics: customTopics || [],
      interval,
      nextReviewDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
    });

    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const problems = await Problem.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update problem status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const { status } = req.body;
    if (!['To Revise', 'Solved', 'Attempted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    problem.status = status;
    await problem.save();
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update problem note
router.patch('/:id/note', protect, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const { note } = req.body;
    problem.note = note || '';
    await problem.save();
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a problem
router.delete('/:id', protect, async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Daily Queue
router.get('/daily-queue', protect, async (req, res) => {
  try {
    const problems = await Problem.find({ 
      userId: req.user._id,
      nextReviewDate: { $lte: new Date() }
    })
    .sort({ difficultyScore: -1, nextReviewDate: 1 })
    .limit(10);
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update review feedback
router.patch('/:id/review', protect, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const { feedback } = req.body;
    let newInterval = problem.interval || 1;
    let diffScoreChange = 0;

    if (feedback === 'Hard') {
      newInterval = 1;
      diffScoreChange = 2;
    } else if (feedback === 'Good') {
      newInterval = newInterval * 2;
      diffScoreChange = -1;
    } else if (feedback === 'Easy') {
      newInterval = newInterval * 3;
      diffScoreChange = -2;
    } else {
      return res.status(400).json({ message: 'Invalid feedback' });
    }

    // Algorithmic fuzzing ±10% jitter (except for Hard which is 1)
    if (feedback !== 'Hard') {
      const jitter = 1 + (Math.random() * 0.2 - 0.1);
      newInterval = Math.max(1, Math.round(newInterval * jitter));
    }

    problem.interval = newInterval;
    problem.nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
    problem.difficultyScore = (problem.difficultyScore || 0) + diffScoreChange;
    
    await problem.save();
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
