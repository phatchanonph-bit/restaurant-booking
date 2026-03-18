const express = require("express");
const path = require("path");
const cors = require("cors");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { handleEvents } = require("./services/realtime");

const app = express();
const frontendDir = process.env.FRONTEND_DIR || path.resolve(__dirname, "../../Frontend");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

app.get("/events", handleEvents);
app.use(publicRoutes);
app.use("/admin", adminRoutes);
app.get("/", (_req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

module.exports = app;
