// syncModel.js
const mongoose = require('mongoose');

const syncSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  hitTimes: { type: [Number], default: [] },
});

const Sync = mongoose.model('Sync', syncSchema);

module.exports = Sync;
