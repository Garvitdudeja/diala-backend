const mongoose = require("mongoose");
const main = require("../main");
const { getRecordsInCreator } = require("./subform");
const Sync = require('./../Schema/SyncSchme.js');


exports.createSync = async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format
    const currentTime = new Date().getTime(); // Get the current timestamp

    // Find or create a document for the current date
    let syncDoc = await Sync.findOne({ date: currentDate });
    if (!syncDoc) {
      syncDoc = new Sync({ date: currentDate });
    }

    const hitTimes = syncDoc.hitTimes;

    // Check if the request can be processed
    if (hitTimes.length >= 3) {
      return res.status(429).json({ error: "Today's quota over " });
    }

    const lastHitTime = hitTimes[hitTimes.length - 1];
    const timeDiff = (currentTime - lastHitTime) / 1000; // time difference in seconds

    if (timeDiff < 60) { // Assuming 60 seconds as the threshold for "in a row"
      return res.status(429).json({ error: "Too many requests in a short period " });
    }

    // Push the current hit time to the array
    hitTimes.push(currentTime);

    const isDraft = await getRecordsInCreator();
    if (isDraft) {
      return res.status(429).json({ error: "Please approve draft first" });
    }

    await main.main();

    // Save the updated document
    syncDoc.hitTimes = hitTimes;
    await syncDoc.save();

    res.status(200).json({ message: "Sync created successfully" });
  } catch (err) {
    console.error("Error handling sync request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLastSyncTime = async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format

    const syncDoc = await Sync.findOne({ date: currentDate });
    if (!syncDoc) {
      return res.status(200).json({ lastSyncTime: [] });
    }

    const hitTimes = syncDoc.hitTimes.map(time => new Date(time).toLocaleTimeString());

    res.status(200).json({ lastSyncTime: hitTimes });
  } catch (err) {
    console.error("Error getting last sync time:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
