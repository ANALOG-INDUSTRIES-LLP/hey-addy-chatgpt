const ChatGPTClient = require("../services/chatgpt");

class Thread {
    constructor() {}

    static async getResponse(receivedThread, sentiment) {
        // Get the prompt
        const prompt = Thread.getPrompt(receivedThread.messages, sentiment);
        const response = await ChatGPTClient.getResponse(prompt.prompt);

        let responseText = response;

        if (!responseText) {
            throw new Error("GetResponseFailed");
        }
        if (responseText.length && responseText.length > 1 &&
            (responseText.slice(0, 1) == "\"" ||
            responseText.slice(0, 1) == "'") &&
            (responseText.slice(-1) == "\"" ||
            responseText.slice(-1) == "'")) {
            // Get what's between the first quotes
            responseText = responseText.slice(1, -1);
        }
        // Agressively replace some placeholders in response
        responseText = Thread.aggressiveReplace(responseText, prompt);

        return responseText;
    }

    static aggressiveFilter(email) {
        const regexMatch1 = /On\s.*,*<*>\swrote:/g; // Matches
        // On {Date} {Person} wrote pattern
        const regexMatch2 = /[-]+ Forwarded message [-]+/g; // Matches
        // --- Forwarded message --- pattern
        if (regexMatch1.test(email)) {
            email = email.split(regexMatch1)[0];
        }
        if (regexMatch2.test(email)) {
            email = email.split(regexMatch2)[0];
        }
        return email;
    }

    /**
     * @desc Replaces chatGPT placeholder texts in response like [Your Name]
     * @param {String} response The response chatgpt made
     * @param {String} prompt The prompt we sent
     * @return {String} response
     */
    static aggressiveReplace(response, prompt) {
        const regexMatch1 = /\[Your Name]/ig;
        response = response.replaceAll(regexMatch1, prompt.requester);
        return response;
    }

    static getPrompt(receivedThread, sentiment) {
        const prompt = [];
        // Iterate through the thread to build the prompt
        for (let i = 0; i < receivedThread.length; i++) {
            const email = receivedThread[i];
            const sender = email.sender;
            const receiver = email.receiver;

            let text = email.text;
            text = Buffer.from(text, "base64").toString("ascii");

            // Agressively filter fluff from email text
            text = Thread.aggressiveFilter(text);

            // Replace new line characters
            text = text.replace(/[\n\r]/g, "");
            if (text.length < 1) continue;
            // For first email in thread:
            if (i == 0) {
                prompt.push(
                    `${sender} sends the following email to ${receiver}: "${text}"
                `);
            } else { // For every other email in thread:
                prompt.push(
                    `${sender} responds to ${receiver} with: "${text}"`);
            }
        }
        // Get the last email in thread, add a call to action for chat gpt
        const lastEmail = receivedThread[receivedThread.length - 1];

        const command = "write an example email of what " + lastEmail.receiver +
        " should respond with to sound " + sentiment +
        " put everything in quotes and correct email format"+
        " include a salutation and a signature";

        prompt.push(command);
        return {
            prompt: prompt.join(" "),
            requester: lastEmail.receiver,
        };
    }
}
module.exports = Thread;
