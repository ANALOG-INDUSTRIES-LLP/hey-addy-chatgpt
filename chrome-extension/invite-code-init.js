// If already claimed invite code go to settings
chrome.storage.sync.get("claimedInvite", async function(data) {
    if (data.claimedInvite) {
        if (!String(window.location).includes("settings")) {
            // Change window to actual settings
            window.location.replace("./settings.html");
        }
    } else {
        if (!String(window.location).includes("main")) {
            window.location.replace("./main.html");
        }
    }
});