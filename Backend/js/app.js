const express = require("express");
const cors = require("cors");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { handleEvents } = require("./services/realtime");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/events", handleEvents);
app.use(publicRoutes);
app.use("/admin", adminRoutes);

module.exports = app;
