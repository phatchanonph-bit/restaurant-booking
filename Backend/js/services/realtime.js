const clients = new Set();

function sendEvent(client, eventName, payload) {
    client.write(`event: ${eventName}\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastBookingChange(action, payload = {}) {
    const eventPayload = {
        action,
        timestamp: new Date().toISOString(),
        ...payload
    };

    for (const client of clients) {
        sendEvent(client, "booking-change", eventPayload);
    }
}

function handleEvents(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders?.();
    res.write("retry: 3000\n\n");

    clients.add(res);
    sendEvent(res, "connected", { ok: true });

    req.on("close", () => {
        clients.delete(res);
    });
}

module.exports = {
    broadcastBookingChange,
    handleEvents
};
