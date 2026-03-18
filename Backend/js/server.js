const http = require("http");
const app = require("./app");
const db = require("./config/db");

const PORT = 3000;
const server = http.createServer(app);

db.connect(err => {
    if (err) {
        console.log("DB Connection Error:", err.message);
        return;
    }

    console.log("MySQL Connected (Port 3307)");
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
