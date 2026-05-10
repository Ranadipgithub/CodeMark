const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  leetcodeUrl: { type: String, required: true },
  difficulty: { type: String },
  leetcodeTags: [{ type: String }],
  customTopics: [{ type: String }],
  status: { type: String, default: 'To Revise' },
  note: { type: String, default: '' },
  interval: { type: Number, default: 1 },
  nextReviewDate: { type: Date, default: Date.now },
  difficultyScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);
