const express = require("express");
const {requestContainsAllRequiredData} = require("../controllers/requestController");
const Thread = require("../models/Thread");

// Below recommended for cloud functions to format console logs
require("firebase-functions/logger/compat");

const router = express.Router();

router.post("/response", async (request, response) => {
    // Thread message text is base64 encoded
    const requiredParams = ["thread", "sentiment"];
    // Parse JSON string
    request.body = (typeof request.body) == "string" ?
        JSON.parse(request.body) : request.body;

    if (!requestContainsAllRequiredData(request, "body", requiredParams)) {
        response.status(400).json({
            success: false,
            reason: "Missing parameter(s)",
        });
        return;
    }

    try {
        const thread = request.body.thread;
        // Sentiment is an object
        const sentiment = request.body.sentiment.tone;
        const suggestion = await Thread.getResponse(thread, sentiment);

        // response.set("Cache-Control", "private, max-age=300, s-maxage=600");
        response.status(200).json({
            success: true,
            response: suggestion,
        });
    } catch (error) {
        if (error.toString().includes("Not signed in")) {
            // TODO: Alert on call;
        }
        console.error(error);
        response.status(500).json({success: false});
    }
});

module.exports = router;
