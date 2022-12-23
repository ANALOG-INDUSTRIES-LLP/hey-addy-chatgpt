const EMAIL = process.env.CHATGPT_EMAIL;
const PASSWORD = process.env.CHATGPT_PASSWORD;

class ChatGPTClient {
    // Making a singleton. Only one instance is created.
    static async getInstance() {
        return await (async () => {
            let api;
            if (!api) {
                const {ChatGPTAPIBrowser} = await import("chatgpt");
                const client = new ChatGPTAPIBrowser({
                    email: EMAIL,
                    password: PASSWORD,
                });
                client.initSession();
                api = client;
            }
            return api;
        })();
    }
}

module.exports = ChatGPTClient;
