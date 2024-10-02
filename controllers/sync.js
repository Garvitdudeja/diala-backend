const fs = require("fs").promises;
const path = require("path");
const main = require("../main");
const { getRecordsInCreator } = require("./subform");

const SYNC_FILE_PATH = path.join(__dirname, "sync.json");

exports.createSync = async (req, res) => {
  try {
    // Read the sync.json file
    let data;
    try {
      const fileContent = await fs.readFile(SYNC_FILE_PATH, "utf8");
      data = JSON.parse(fileContent);
    } catch (err) {
      if (err.code === "ENOENT") {
        // If the file doesn't exist, initialize it
        data = {};
      } else {
        throw err;
      }
    }

    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format
    const currentTime = new Date().getTime(); // Get the current timestamp

    // If the current date key is not present, initialize it with an empty array
    if (!data[currentDate]) {
      data[currentDate] = [];
    }

    const hitTimes = data[currentDate];

    // Check if the request can be processed
    if (hitTimes.length >= 3) {
      return res.status(429).json({ error: "Today's quota over " });
    }

    const lastHitTime = hitTimes[hitTimes.length - 1];
    const timeDiff = (currentTime - lastHitTime) / 1000; // time difference in seconds

    console.log("timeDiff", timeDiff);

    if (timeDiff < 10860) {
      console.log("timeDiff < 60");
      // Assuming 60 seconds as the threshold for "in a row"
      return res
        .status(429)
        .json({ error: "Too many requests in a short period " });
    }

    // Push the current hit time to the array
    hitTimes.push(currentTime);

    const isDraft = await getRecordsInCreator();
    if (isDraft) {
      return res.status(429).json({ error: "Please approve draft first" });
    }

    await main.main();

    console.log("data for sync", data);

    const dir = path.dirname(SYNC_FILE_PATH);

    // Ensure the directory exists, if not, create it
    await fs.mkdir(dir, { recursive: true });

    // Save the updated data back to sync.json
    await fs.writeFile(SYNC_FILE_PATH, JSON.stringify(data, null, 2), "utf8");

    res.status(200).json({ message: "Sync created successfully" });
  } catch (err) {
    console.error("Error handling sync request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLastSyncTime = async (req, res) => {
  try {
    // Read the sync.json file
    const fileContent = await fs.readFile(SYNC_FILE_PATH, "utf8");
    const data = JSON.parse(fileContent);

    const currentDate = new Date().toISOString().split("T")[0]; // Get the current date in YYYY-MM-DD format

    // If the current date key is not present, return an empty array
    if (!data[currentDate]) {
      return res.status(200).json({ lastSyncTime: [] });
    }

    const hitTimes = data[currentDate];

    hitTimes.map((time, index) => {
      hitTimes[index] = new Date(time).toLocaleTimeString();
    });

    // convert the timestamps to the readable format

    res.status(200).json({ lastSyncTime: hitTimes });
  } catch (err) {
    console.error("Error getting last sync time:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
