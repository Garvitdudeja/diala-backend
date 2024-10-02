const express = require("express");
const app = express();
const routes = require("./routes");
const cors = require("cors");

// Use built-in middleware for JSON and URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.json({ extended: false }));

app.use("/", routes);

module.exports = app;
