const Firestore = require("./firebaseFirestore");
const axios = require("axios");

const db = new Firestore();

class ChatGPTClient {
    static async getResponse(prompt) {
        const tunnelDoc = await db.getDocInCollection("whereis", "string-types");
        if (!tunnelDoc || tunnelDoc == undefined) {
            return undefined;
        }
        const url = `${tunnelDoc.tunnel}/chatgpt/ask`;
        // Make request to tunnel url to get response
        const body = {
            prompt: prompt,
        };
        const response = await axios.post(url, JSON.stringify(body), {
            headers: {
                "Bypass-Tunnel-Reminder": true,
            },
        }).then(async (response) => {
            if (response.data.success) {
                return response.data.response;
            } else {
                return undefined;
            }
        }).catch((error) => {
            // TODO: Alert on call
            console.log(error);
            return undefined;
        });
        return response;
    }
}

module.exports = ChatGPTClient;
