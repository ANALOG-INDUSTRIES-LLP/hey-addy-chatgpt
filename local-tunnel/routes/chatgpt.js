const express = require("express");
const {requestContainsAllRequiredData} = require("../controllers/requestController");
const ChatGPT = require("../models/Chatgpt");

const router = express.Router();

router.post("/ask", async (request, response) => {
    // Thread message text is base64 encoded
    const requiredParams = ["prompt"];
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
        const prompt = request.body.prompt;
        const reply = await ChatGPT.getResponse(prompt);
        response.status(200).json({
            success: true,
            response: reply,
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
