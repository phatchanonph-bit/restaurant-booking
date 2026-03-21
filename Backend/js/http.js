const fs = require("fs");
const path = require("path");

const CONTENT_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8"
};

// เติมความสามารถพื้นฐานให้ response object ของ Node
function addResponseHelpers(res) {
    res.status = code => {
        res.statusCode = code;
        return res;
    };

    res.json = data => {
        if (!res.headersSent) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
        }

        res.end(JSON.stringify(data));
    };

    res.send = text => {
        if (!res.headersSent) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
        }

        res.end(text);
    };

    // ส่งไฟล์กลับไปให้ browser เช่น html, css, js, รูปภาพ
    res.sendFile = filePath => {
        const extension = path.extname(filePath).toLowerCase();
        const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

        fs.stat(filePath, (error, stats) => {
            if (error || !stats.isFile()) {
                res.status(404).send("Not Found");
                return;
            }

            res.statusCode = res.statusCode || 200;
            res.setHeader("Content-Type", contentType);

            if (res.req.method === "HEAD") {
                res.end();
                return;
            }

            const stream = fs.createReadStream(filePath);
            stream.on("error", () => {
                if (!res.headersSent) {
                    res.status(500).send("Internal Server Error");
                    return;
                }

                res.destroy();
            });
            stream.pipe(res);
        });
    };

    return res;
}

// เพิ่ม CORS header แบบพื้นฐานให้ทุก response
function addCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// อ่าน body ที่ส่งมา แล้วแปลงจาก JSON string เป็น object
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        if (req.method === "GET" || req.method === "HEAD") {
            resolve({});
            return;
        }

        let rawBody = "";

        req.on("data", chunk => {
            rawBody += chunk;
        });

        req.on("end", () => {
            if (!rawBody) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(rawBody));
            } catch (error) {
                reject(new Error("INVALID_JSON"));
            }
        });

        req.on("error", reject);
    });
}

// ดึง path และ query string จาก URL request
function getRequestInfo(req) {
    const url = new URL(req.url, "http://localhost");

    return {
        pathname: decodeURIComponent(url.pathname),
        query: Object.fromEntries(url.searchParams.entries())
    };
}

// วนหาจากรายการ route ว่าอันไหนตรงกับ request ปัจจุบัน
function matchRoute(routes, method, pathname) {
    for (const route of routes) {
        if (route.method !== method) {
            continue;
        }

        const params = matchPath(route.path, pathname);

        if (params) {
            return {
                ...route,
                params
            };
        }
    }

    return null;
}

// เทียบ path จริงกับ path template เช่น /admin/delete/:id
function matchPath(routePath, pathname) {
    const routeParts = routePath.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    if (routeParts.length !== pathParts.length) {
        return null;
    }

    const params = {};

    for (let index = 0; index < routeParts.length; index += 1) {
        const routePart = routeParts[index];
        const pathPart = pathParts[index];

        if (routePart.startsWith(":")) {
            params[routePart.slice(1)] = pathPart;
            continue;
        }

        if (routePart !== pathPart) {
            return null;
        }
    }

    return params;
}

// ป้องกัน path หลุดออกนอกโฟลเดอร์ Frontend เวลาขอไฟล์ static
function getSafeFilePath(frontendDir, pathname) {
    const targetPath = pathname === "/" ? "/index.html" : pathname;
    const fullPath = path.resolve(frontendDir, `.${targetPath}`);

    if (!fullPath.startsWith(frontendDir)) {
        return null;
    }

    return fullPath;
}

module.exports = {
    addCorsHeaders,
    addResponseHelpers,
    getRequestInfo,
    getSafeFilePath,
    matchRoute,
    parseJsonBody
};
