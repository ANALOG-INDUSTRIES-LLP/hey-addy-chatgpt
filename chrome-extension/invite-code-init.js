// If already claimed invite code go to settings
chrome.storage.sync.get("claimedInvite", async function(data) {
    if (data.claimedInvite) {
        // Change window to actual settings
        window.location.replace("./settings.html");
    }
});