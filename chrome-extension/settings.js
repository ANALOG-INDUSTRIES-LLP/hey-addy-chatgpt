const firebaseConfig = {
    apiKey: "AIzaSyCDBO1NWURhFlBZpd1Bxc2pxUPhV8k8LMQ",
    authDomain: "hey-addy-chatgpt.firebaseapp.com",
    projectId: "hey-addy-chatgpt",
    storageBucket: "hey-addy-chatgpt.appspot.com",
    messagingSenderId: "284266859441",
    appId: "1:284266859441:web:1253e79ad223c0e7410b90",
    measurementId: "G-B10H5SHQ5C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

let defaultVoice = null;
let currentUser = null;

// If user, show main content, else show login.
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        window.user = user;
        currentUser = user;
    } else {
        window.location.replace("./login.html");
    }
});

chrome.storage.sync.get("defaultTone", async function(data) {
    if (data.defaultTone) {
        // exists
        defaultVoice = data.defaultTone;
    }
});

window.onload = function() {
    const selectTone = document.getElementById("selectTone");

    chrome.storage.sync.get("defaultTone", async function(data) {
        if (data.defaultTone) {
            // exists
            defaultVoice = data.defaultTone;
            if (selectTone) {
                // Add sentiments
                for (let i = 0; i < sentiments.length; i++) {
                    const sentiment = sentiments[i];
                    const toneElement = document.createElement("option");
                    toneElement.value = sentiment;
                    toneElement.innerHTML = titleCase(sentiment);
        
                    // set UI for default voice
                    if (defaultVoice !== null && defaultVoice == sentiment) {
                        toneElement.selected = true;
                    }            
                    selectTone.append(toneElement);
                }
            }
        } else {
            // Not selected
            if (selectTone) {
                // Add sentiments
                for (let i = 0; i < sentiments.length; i++) {
                    const sentiment = sentiments[i];
                    const toneElement = document.createElement("option");
                    toneElement.value = sentiment;
                    toneElement.innerHTML = titleCase(sentiment);          
                    selectTone.append(toneElement);
                }
            }
            
        }
    });

    // Add onchange listener
    addToneOnChangeListener(selectTone);
    handleContactMeClick();
    allowSignOut();
}

function alertDefaultTone() {
    chrome.storage.sync.get("defaultTone", async function(data) {
        alert(data.defaultTone);
    });
}

function addToneOnChangeListener(selectTone) {
    selectTone.addEventListener("change", function(){
        var e = selectTone;
        var selected = e.options[e.selectedIndex].value;

        chrome.storage.sync.set({defaultTone: selected});
   });
}

function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(' '); 
}

function handleContactMeClick() {
    const contactMeBtn = document.getElementById("contact-me-link");
    if (contactMeBtn) {
        contactMeBtn.addEventListener("click", () => {
            window.open("https://twitter.com/michael_vandi", "_blank");
        })
    }
}

function allowSignOut() {
    const signOutButton = document.getElementById("sign-out-btn");
    if (signOutButton) {
        signOutButton.addEventListener("click", () => {
            // Sign out with firebase
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    // Sign out
                    firebase.auth().signOut().then(function() {
                        window.user = {};
                        window.location.replace("./login.html")
                    }).catch(function(error) {
                        alert("Sorry something went wrong");
                    });
                } 
            });
        
        });
    }
}

const sentiments = ["friendly", "respectful", "formal", "informal",
    "funny", "excited", "interested", "not interested", "thankful",
    "angry", "surprised"
];