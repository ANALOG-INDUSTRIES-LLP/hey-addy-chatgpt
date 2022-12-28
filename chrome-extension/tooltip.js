let authToken = null;
let clickedSentiment = null;
let globalThread = null;
let globalSentiment = "friendly";
let emailMessageBox = null;
let API_URL = "https://hey-addy.web.app";
let currentUser = null;
let currentlyWriting = false;

chrome.storage.sync.get("user", async function(data) {
    if (!data.user) {
        currentUser = null;
        return;
    }
    currentUser = data.user;
});


window.onload = async function() {
    getAuthToken() // Get gmail auth token
    main(); // Loads the tooltip bar
}

const sentiments = [
    {
        tone: "friendly",
        html: "&#128522"
    },
    {
        tone: "respectful",
        html: "&#127913"
    },
    {
        tone: "formal",
        html: "&#128084"
    },
    {
        tone: "informal",
        html: "&#128085"
    },
    {
        tone: "funny",
        html: "&#128513"
    },
    {
        tone: "excited",
        html: "&#129321"
    },
    {
        tone: "interested",
        html: "&#128077"
    },
    {
        tone: "not interested",
        html: "&#128558"
    },
    {
        tone: "thankful",
        html: "&#128588"
    },
    {
        tone: "angry",
        html: "&#128545"
    },
    {
        tone: "surprised",
        html: "&#128558",
    }
];


function getAuthToken() {
    // Get auth token from background.js
    chrome.runtime.sendMessage({ message: "get-auth-token" }, function (response) {
        if (response.message && response.message == "success") {
            authToken = response.token;
        }
    });
}

function stringSentenceCase(str) {
    return str.replace(/\.\s+([a-z])[^\.]|^(\s*[a-z])[^\.]/g, s => s.replace(/([a-z])/,s => s.toUpperCase()))
}

function main() {
    // Select the node that will be observed for mutations
    const targetNode = document.querySelector('body');

    // Options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };
    const selector = '.editable[aria-label="Message Body"]';
    const settings = {}
    observeRecursively(targetNode, config, selector, settings);
    
}

function observeRecursively(targetNode, config, selector, settings) {
    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        let toolTipAdded = false;
        if (addedNodes(mutationsList)) {
            toolTipAdded = addTooltipToElements(selector, settings, observer);
        }
    
        observer.disconnect();
        
        // If the overlay tooltip wasn't added, observe DOM again for
        // changes
        if (!toolTipAdded) {
            observeRecursively(targetNode, config, selector, settings);
        }
    };
  
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
  
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

// Check if new nodes have been added to the dom
function addedNodes(mutations) {
    let hasUpdates = false;
  
    for (let index = 0; index < mutations.length; index++) {
      const mutation = mutations[index];
  
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        hasUpdates = true;
        break;
      }
    }
  
    return hasUpdates;
}

// Add the overlay box to the Messagebox element
function addTooltipToElements(selector, settings, observer) {
    let messageBox = document.querySelector(selector);
    if (messageBox !== null) {
        emailMessageBox = messageBox;
        // Get parent div 2 nodes up. First node does not have ID
        // to select
        const parentDiv = messageBox.parentNode.parentNode;
        const parentID = parentDiv.id;

        const parent = document.getElementById(parentID);
        const toolTipDiv = document.createElement("div");
        // Make emailMessageBox allow line breaks
        messageBox.style.whiteSpace = "pre-wrap";

        // Configure ToolTipDiv
        configureToolTipDiv(toolTipDiv);
        // Create the Sentiment Elements
        createSentimentElementsInTooltip(sentiments, toolTipDiv);

        // Add Tooltip to view
        parent.prepend(
            toolTipDiv
        )
        findEmailThread();

        return true;
    } else {
        return false;
    }
}

async function findEmailThread() {
    const legacyThreadElement = document.querySelector('[data-legacy-thread-id]');
    if (!legacyThreadElement || legacyThreadElement == null
        || legacyThreadElement == undefined) {
        // TODO: Send a message that legacy thread data not found
    }

    const threadID = legacyThreadElement.getAttribute('data-legacy-thread-id');
    let thread = await fetchThread(threadID);
    // For every thread, get the message, build thread.
    // add relevant data.
    thread = filterThread(thread);
    globalThread = thread;
}

function filterThread(thread) {
    // Raw thread contains a bunch of unnecessary stuff,
    // Filter, message, sender, receiver, subject
    const messages = thread.messages;
    if (messages == undefined || !messages.length ||
        messages.length == undefined || messages.length < 1) {
        alert(`Addy.ai\n
            Please authorize addy.ai to use this GMail account
        `)
        getAuthToken();
        throw new Error("NoMessagesInThread");
    }
    // Iterate through messages
    const newThread = {
        messages: [],
        subject: "",
    };

    const filteredMessages = [];

    for (let i = 0; i < messages.length; i++) {
        const email = messages[i];
        // If no email payload skip this email
        if (email.payload == undefined) continue;
        const msg = {}
        const headers = email.payload.headers;
        let text = email.payload.parts[0].body.data;
        // Conver text from base 64 to plain
    
        // Iterate throught headers and find From, To, Subject
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const value = header.value;
            if (header.name == "From") {
                const sender = value.includes("<") ?
                    value.split("<")[0].trim() : value;
                msg["sender"] = sender;
            } else if (header.name == "To") {
                const receiver = value.includes("<") ?
                    value.split("<")[0].trim() : value;
                msg["receiver"] = receiver;
            } else if (header.name == "Subject") {
                if (newThread.subject.length < 1) {
                    newThread.subject = value;
                }
            } else {
                continue; // skip
            }
        }

        // Combine everything
        msg["text"] = text;
        filteredMessages.push(msg);
    }
    newThread.messages = filteredMessages;
    return newThread;
}

async function fetchThread(threadID) {
    // Check if we have an auth token
    if (authToken == null) {
        alert(`Addy.ai\n
            Please Sign In To Your Google Account
        `)
        getAuthToken();
        throw new Error("AuthTokenIsNull");
    }
    const config = {
        method: 'GET',
        async: true,
        headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        'contentType': 'json'
    };

    let dataReceived = {};
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadID}`, config)
        .then((response) => response.json())
        .then((data) => {
            dataReceived = data;
        }).catch((error) => {
            throw error;
        })
    return dataReceived;
}

async function displaySuggestionFetchError(messageBox, errorText) {
    // const errorParagraph = document.createElement("p");
    // errorParagraph.innerHTML = errorText;
    // errorParagraph.style.position = "absolute";
    // errorParagraph.style.color = "red";
    // errorParagraph.style.top = "100%";
    // errorParagraph.style.left = "50%";
    // errorParagraph.style.marginLeft = "-5px";
    // errorParagraph.style.borderWidth = "5px";
    // errorParagraph.style.whiteSpace = "pre-wrap";
    // messageBox.append(errorParagraph);
    alert(errorText);

    /*
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
    */

}

async function fetchSuggestion(requestData, endpoint) {
    // TODO: When there's a 401, ask user to login
    const data = requestData;
    let suggestion = "";
    await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            suggestion = data.response;
        } else {
            displaySuggestionFetchError(
                emailMessageBox, 
                "Addy.ai\nService is down. Please try again soon.",
            );
        }
    })
    .catch((error) => {
        displaySuggestionFetchError(
            emailMessageBox, 
            "Addy.ai\nService is down. Please try again soon.",
        );
        console.error('Error:', error);
    });
    return suggestion;
}



function configureToolTipDiv(toolTipDiv) {
    toolTipDiv.className = "hey-addy-tooltip";
    toolTipDiv.style.display = "flex";
    toolTipDiv.style.flexWrap = "wrap";
    toolTipDiv.style.flexDirection = "row";
    toolTipDiv.style.paddingTop = "6px";
    toolTipDiv.style.paddingBottom = "10px";
    toolTipDiv.style.width = "100%"; 
}

function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(' '); 
}

function swapSentiments(sentiment1, sentiment2) {
    // Find both indices and swap;
    const index1 = findSentimentIndex(sentiments, sentiment1);
    const index2 = findSentimentIndex(sentiments, sentiment2);

    if ((index1 == null || index2 == null) || index2 < 4) {
        return sentiments;
    }
    // Both indices are available, swap
    let temp = sentiments[index1];
    sentiments[index1] = sentiments[index2];
    sentiment2[index2] = temp;
    return sentiments;

}

function findSentimentIndex(sentiments, value) {
    let index = null;
    for (let i = 0; i < sentiments.length; i++) {
        if (sentiments[i].tone == value) {
            index = i;
            break;
        }
    }
    return index;
}

var clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
});

function createSentimentElementsInTooltip(sentiments, toolTip) {
    // Check if there's a default sentiment
    chrome.storage.sync.get("defaultTone", async function(data) {
        const defaultTone = data.defaultTone;
        if (defaultTone) {
            // Set global sentiment to default tone
            globalSentiment = defaultTone;
            // Render default tone in UI
            // Swap first sentiment in list with default sentiment
            const firstSentiment = sentiments[0].tone;
            if (firstSentiment !== defaultTone) {
                // Swap
                sentiments = swapSentiments(firstSentiment,
                    defaultTone);
            }

        }
        for (let i = 0; i < sentiments.length; i++) {
            if(i > 4) break;
            let sentiment = sentiments[i] // Full object with attributes
            const sentimentElement = document.createElement("div");
            sentimentElement.classList.add("sentiment-button");
            const HTMLValue = sentiment.html +
                "&nbsp;"+
                titleCase(sentiment.tone);
            sentimentElement.innerHTML = HTMLValue;
            const sentimentID = "hey-addy-sentiment-" + i.toString();
            sentimentElement.setAttribute("id", sentimentID);
            sentimentElement.style = {};
            // Add styles
            addUnclickedStylesForSentimentButton(sentimentElement);

            // Add mouse over and leave behavior
            setSentimentMouseHoverBehavior(sentimentElement);
            setSentimentMouseOutBehavior(sentimentElement);

            // Add a listener to the sentiment element
            addSentimentOnClickListener(sentimentElement, sentiment);
            
            toolTip.append(sentimentElement); // Add sentiment
            // Click on the default sentiment
            if (defaultTone && (sentiment.tone == defaultTone)) {
                sentimentElement.dispatchEvent(clickEvent);
            } else if (globalSentiment !== null 
                && (globalSentiment == sentiment.tone)) {
                    sentimentElement.dispatchEvent(clickEvent);
            }
        }

        // Create  the write button
        createWriteButtonInTooltip(toolTip);
        // Create the three dots menu
        createThreeDotsMenuInToolTip(toolTip);
        
    });
}

function createThreeDotsMenuInToolTip(tooltip) {
    const threeDots = document.createElement("div");
    threeDots.innerHTML = "•••";
    threeDots.setAttribute("id", "three-dots");
    threeDots.style = {};
    // Add styles
    addUnClickedStylesForThreeDots(threeDots);
    setThreeDotsMouseHoverBehavior(threeDots);
    setThreeDotsMouseOutBehavior(threeDots);

    // On click listener
    onThreeDotsClick(threeDots);
    // Add to tooltip
    tooltip.append(threeDots);
}

function onThreeDotsClick(threeDots) {
    threeDots.addEventListener("click", () => {
        // Add click styles
        addClickedStylesForThreeDots(threeDots);
        chrome.runtime.sendMessage({message: "open-options"});
    })
}

function setThreeDotsMouseHoverBehavior(threeDots) {
    threeDots.addEventListener('mouseover', () => {
        addClickedStylesForThreeDots(threeDots);
    });
}
function setThreeDotsMouseOutBehavior(threeDots) {
    threeDots.addEventListener('mouseleave', () => {
        addUnClickedStylesForThreeDots(threeDots);
    });
}

function addUnClickedStylesForThreeDots(threeDots) {
    threeDots.style.display = "flex";
    threeDots.style.marginBottom = "8px";
    threeDots.style.flexDirection = "row";
    threeDots.style.justifyContent = "center";
    threeDots.style.alignItems = "center";
    threeDots.style.fontSize = "15px";
    threeDots.style.borderRadius = "5px";
    threeDots.style.cursor = "pointer";
    threeDots.style.color = "#282828";
    threeDots.style.backgroundColor = "transparent";
    // threeDots.style.border = "1px solid rgba(111, 112, 112, 0.5)";
    threeDots.style.border = "1px solid transparent";
    threeDots.style.paddingLeft = "10px";
    threeDots.style.paddingRight = "10px";
    // threeDots.style.paddingTop = "2px";
    // threeDots.style.paddingBottom = "3px";
    threeDots.style.marginRight = "11px";
    threeDots.style.fontFamily = "Helvetica, sans-serif";
}

function addClickedStylesForThreeDots(threeDots) {
    threeDots.style.cursor = "pointer";
    // threeDots.style.border = "1px solid rgba(116, 152, 225, 0.3)";
    threeDots.style.backgroundColor = "rgba(116, 152, 225, 0.2)";
    threeDots.style.cursor = "pointer";
    threeDots.style.color = "#165BD1";
}

function createWriteButtonInTooltip(toolTip) {
    const writeButton = document.createElement("div");
    writeButton.innerHTML = "Write email";
    writeButton.setAttribute("id", "hey-addy-write-button");
    writeButton.style = {};
    // Add styles
    addUnClickedStylesForWriteButton(writeButton);

    // Add mouse over and leave behavior
    setWriteButtonMouseHoverBehavior(writeButton);
    setWriteButtonMouseOutBehavior(writeButton);

    // Add a listener to the sentiment element
    addWriteButtonOnClickListener(writeButton, {});
    toolTip.append(writeButton);
}

// Onclick listener for write button
async function addWriteButtonOnClickListener(writeButton) {
    writeButton.addEventListener("click", async () => {

        // Update styles
        addClickedStylesForWriteButton(writeButton);
        // Check if user has invite
        chrome.storage.sync.get("claimedInvite", async function(data) {
            if (!data.claimedInvite) {
                alert("Addy.ai \n\nNo invite code set.\nPlease open extension and enter your invite code");
                return;
            }
            if (globalSentiment == null) {
                alert("Addy.ai \n\nPlease select a tone");
                return;
            }
            // Make request
            if (globalThread == null) {
                alert("Sorry something went wrong. Are you signed in?");
                getAuthToken();
                return;
            }
            
            const uid = currentUser == null ? undefined : currentUser.uid;
            const requestData = {
                thread: globalThread,
                sentiment: globalSentiment,
                userID: uid,
            }
            // Fetch suggestion
            if (currentlyWriting) return;
            writeButton.innerHTML = "Thinking...";
            const suggestion = await fetchSuggestion(
                requestData,
                `${API_URL}/thread/response`
            )
            currentlyWriting = true;
            if (suggestion && suggestion.length && suggestion.length > 1) {
                
                typeSuggestionInMessageBox(
                    emailMessageBox,
                    suggestion,
                    50, // 50ms, delay for each character typed
                )
                writeButton.innerHTML = "Write email";
            } else {
                writeButton.innerHTML = "Write email";
                currentlyWriting = false;
            }
        });
    });
}

function typeSuggestionInMessageBox(messageBox, text, typingSpeed) {
    // Clear Message box
    messageBox.innerHTML = "<pre></pre>";
    var i = 0;
    function typer() {
        if (i < text.length) {
            messageBox.innerHTML += text.charAt(i);
            i++;
            setTimeout(typer, typingSpeed);
        }
        if (i == text.length - 1) currentlyWriting = false;
    }
    typer();
}

function setWriteButtonMouseHoverBehavior(writeButton) {
    writeButton.addEventListener('mouseover', () => {
        
        addClickedStylesForWriteButton(writeButton)
    });
}

function setWriteButtonMouseOutBehavior(writeButton) {
    writeButton.addEventListener('mouseleave', () => {
        
        addUnClickedStylesForWriteButton(writeButton)
    });
}

function addSentimentOnClickListener(sentimentButton, sentiment) {
    sentimentButton.addEventListener("click", () => {
        // Get previously clicked sentiment if any, remove styles
        if (clickedSentiment !== null) {
            clickedSentiment.classList.remove("sentiment-clicked");
            addUnclickedStylesForSentimentButton(clickedSentiment);
        }
        // Update the styles of this sentiment
        sentimentButton.classList.add("sentiment-clicked");
        addClickedStylesForSentimentButton(sentimentButton);
    
        // Update the global state of which element has been clicked
        clickedSentiment = sentimentButton;
        globalSentiment = sentiment;
    });
}

function setSentimentMouseHoverBehavior(sentimentButton) {
    sentimentButton.addEventListener('mouseover', () => {
        // If this is the clicked element do nothing, else configure
        if (clickedSentiment == null) return;

        if (sentimentButton.id !== clickedSentiment.id) {
            addClickedStylesForSentimentButton(sentimentButton)
        }
    });
}

function setSentimentMouseOutBehavior(sentimentButton) {
    sentimentButton.addEventListener('mouseleave', () => {
        // If this is the clicked element do nothing, else configure
        if (clickedSentiment == null) return;

        if (sentimentButton.id !== clickedSentiment.id) {
            addUnclickedStylesForSentimentButton(sentimentButton)
        }
    });
}

function addUnclickedStylesForSentimentButton(sentimentButton) {
    sentimentButton.style.border = "1px solid rgba(111, 112, 112, 0.5)";
    sentimentButton.style.paddingLeft = "10px";
    sentimentButton.style.paddingRight = "10px";
    sentimentButton.style.paddingTop = "2px";
    sentimentButton.style.marginBottom = "8px";
    sentimentButton.style.paddingBottom = "3px";
    sentimentButton.style.borderRadius = "7px";
    sentimentButton.style.fontSize = "15px";
    sentimentButton.style.color = "#282828";
    sentimentButton.style.fontFamily = "Helvetica, sans-serif";
    sentimentButton.style.marginRight = "11px";
    sentimentButton.style.display = "flex";
    sentimentButton.style.flexDirection = "row";
    sentimentButton.style.justifyContent = "center";
    sentimentButton.style.alignItems = "center";
    sentimentButton.style.backgroundColor = "transparent";
    sentimentButton.style.cursor = "pointer";

}
function addClickedStylesForSentimentButton(sentimentButton) {
    sentimentButton.style.color = "#165BD1";
    sentimentButton.style.backgroundColor = "rgba(116, 152, 225, 0.2)";
    sentimentButton.style.border = "1px solid rgba(116, 152, 225, 0.3)";
    sentimentButton.style.transition = "0.3s all ease";
    sentimentButton.style.cursor = "pointer";
}

function addClickedStylesForWriteButton(writeButton, action) {
    // action can be one of "hover" or "click"
    // writeButton.style.boxShadow = "0 4px 7px 0 rgba(152, 160, 180, 10)"
    writeButton.style.boxShadow = "0 1px 6px 2px rgba(137, 167, 230, 1)"
    // writeButton.style.background = "linear-gradient(to right, #E040FB, #00BCD4)";
    writeButton.style.transition = "0.3s all ease";
    writeButton.style.cursor = "pointer";

    if (action == "click") {
        // After x time. set back to unclicked state
    }

}

function addUnClickedStylesForWriteButton(writeButton) {
    writeButton.style.boxShadow = "none"
    writeButton.style.marginBottom = "8px";
    writeButton.style.border = "transparent";
    writeButton.style.paddingLeft = "10px";
    writeButton.style.paddingRight = "10px";
    writeButton.style.paddingTop = "2px";
    writeButton.style.paddingBottom = "3px";
    writeButton.style.borderRadius = "7px";
    writeButton.style.fontSize = "15px";
    writeButton.style.color = "rgba(255, 255, 225, 0.9)";
    writeButton.style.fontFamily = "Helvetica, sans-serif";
    writeButton.style.marginRight = "11px";
    writeButton.style.display = "flex";
    writeButton.style.flexDirection = "row";
    writeButton.style.justifyContent = "center";
    writeButton.style.alignItems = "center";
    writeButton.style.background = "#0A57D0";
}
