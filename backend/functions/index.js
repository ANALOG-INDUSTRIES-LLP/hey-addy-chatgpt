const cors = require("cors");
const express = require("express");
const functions = require("firebase-functions");
const {apiAccessClientAddresses} = require("./config/config");
const bodyParser = require("body-parser");

const authTriggers = require("./triggers/authentication");

const api = express();

api.use(cors({
    origin: apiAccessClientAddresses,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

api.use(bodyParser.json({limit: "50mb"}));
api.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));
api.use(bodyParser.text({limit: "200mb"}));

api.get("/", async (request, response) => {
    response.status(200).json({success: true});
});
api.use("/thread", require("./routes/thread"));
api.use("/user", require("./routes/user"));

exports.api = functions.https.onRequest(api);

// Exporting all automated functions
exports.addNewUserToDb = authTriggers.addNewUserToDb;
