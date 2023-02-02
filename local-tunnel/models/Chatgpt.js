const ChatGPTClient = require("../services/chatgpt");
const chatGPTAPI = ChatGPTClient.getInstance(); // Singleton

class ChatGPT {
    constructor() {}

    static async getResponse(prompt) {
        // Get the prompt
        const response = await (await chatGPTAPI).sendMessage(
            prompt,
        );
        const responseText = response.response;
        return responseText;
    }
}

module.exports = ChatGPT;
