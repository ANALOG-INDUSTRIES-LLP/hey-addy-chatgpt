const express = require("express");
const {requestContainsAllRequiredData} = require("../controllers/requestController");
const User = require("../models/User");

// Below recommended for cloud functions to format console logs
require("firebase-functions/logger/compat");

const router = express.Router();

router.post("/redeem-invite", async (request, response) => {
    const requiredParams = ["code", "userID"];
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
        const code = request.body.code;
        const uid = request.body.userID;

        const isValid = await User.inviteCodeValid(code);

        if (!isValid && isValid == false) {
            // TODO: Send a 404
            response.status(404).json({success: true,
                valid: false,
            });
            return;
        }
        // Code is valid, update DB
        const redeemCode = await User.redeemInviteCode(code, uid);
        if (!redeemCode || redeemCode == null) {
            // Did not redeem
            response.status(500).json({success: false});
            return;
        }
        response.status(200).json({
            success: true,
            valid: true,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({success: false});
    }
});

router.get("/has-redeemed-invite", async (request, response) => {
    const requiredParams = ["uid"];
    // Parse JSON string
    request.query = (typeof request.query) == "string" ?
        JSON.parse(request.query) : request.query;

    if (!requestContainsAllRequiredData(request, "query", requiredParams)) {
        response.status(400).json({
            success: false,
            reason: "Missing parameter(s)",
        });
        return;
    }

    try {
        const uid = request.query.uid;

        const redeemed = await User.hasRedeemedInvite(uid);
        if (!redeemed || redeemed == null) {
            // Did not redeem
            response.status(500).json({success: false});
            return;
        }
        response.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        response.status(500).json({success: false});
    }
});

module.exports = router;
