const firebaseConfig = {
    apiKey: "AIzaSyCDBO1NWURhFlBZpd1Bxc2pxUPhV8k8LMQ",
    authDomain: "hey-addy-chatgpt.firebaseapp.com",
    projectId: "hey-addy-chatgpt",
    storageBucket: "hey-addy-chatgpt.appspot.com",
    messagingSenderId: "284266859441",
    appId: "1:284266859441:web:1253e79ad223c0e7410b90",
    measurementId: "G-B10H5SHQ5C"
};
let API_URL = "https://hey-addy.web.app";
let currentUser = null;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// If user, show main content, else show login.
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        window.user = user;
        currentUser = user;
        await showView();
    } else {
        window.location.replace("./login.html");
    }
});

async function showView() {
    // Skip invite code if already claimed invite
    chrome.storage.sync.get("claimedInvite", async function(data) {
        if (data.claimedInvite) {
            // Change window to actual settings
            window.location.replace("./settings.html");
        } else {
            // Display invite code screen
            const inviteCodeDiv = document.getElementById("invite-code-div");
            if (inviteCodeDiv) inviteCodeDiv.style.display = "block";
            // Has not claimed invite locally but is registered
            // Call API to check and update local accordingly
            await updateInviteStatus(currentUser.uid);
        }
    });
}



let authToken = null;

window.onload = function() {
    // Check for invite code.
    allowSignOut();
    handleContactMeClick();
    handleInviteCode();
    // If there's one already redeemed by user, show main page
    // If none is redeemed, show invite code page
}

async function handleInviteCode() {
    const submitCodeButton = document.getElementById("get-access-button");
    
    const code1 = document.getElementById("otc-1");
    const code2 = document.getElementById("otc-2");
    const code3 = document.getElementById("otc-3");
    const code4 = document.getElementById("otc-4");
    const errorText = document.getElementById("submit-error-text");

    if (submitCodeButton && code1) {
       
        submitCodeButton.addEventListener("click", async () => {
            const code = code1.value + code2.value + code3.value + code4.value;
            if (code.length !== 4) {
                // Do something TODO:
                errorText.innerHTML = "Code is badly formatted";
                clearText(errorText);
                return;
            }
            await checkInviteCode(code, submitCodeButton);
            // Enable button again
        });
    }
}
function clearText(element) {
    setTimeout(() => {
        element.innerHTML = "&nbsp;";
    }, 4000);
}

// Updates the invite code status of the user locally
async function updateInviteStatus(uid) {
    // Check the API to get invite status
    await fetch(`${API_URL}/user/has-redeemed-invite?uid=${uid}`, {
        method: 'GET',
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            // update invite status locally
            chrome.storage.sync.set({claimedInvite: true});
            window.location.replace("./settings.html");
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


async function checkInviteCode(code, button) {
    button.innerHTML = "...CHECKING"
    const errorText = document.getElementById("submit-error-text");
    await fetch(`${API_URL}/user/redeem-invite`, {
        method: 'POST',
        body: JSON.stringify({
            code: code,
            userID: currentUser.uid,
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            if (!data.valid) {
                errorText.innerHTML = "Invalid Invite Code";
                clearText(errorText);
                return;
            } 
            // Invite Code is valid
            button.innerHTML = "SUBMIT";
            // Store the invite status in settings
            const user = currentUser == null ? undefined : currentUser;
            chrome.storage.sync.set({claimedInvite: true});
            chrome.storage.sync.set({user: user});
            window.location.replace("./settings.html");
        } else {
            button.innerHTML = "SUBMIT";
            alert("Sorry something went wrong");
            return ;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    button.innerHTML = "SUBMIT";
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

let in1 = document.getElementById('otc-1'),
    ins = document.querySelectorAll('input[type="number"]'),
	 splitNumber = function(e) {
		let data = e.data || e.target.value; // Chrome doesn't get the e.data, it's always empty, fallback to value then.
		if ( ! data ) return; // Shouldn't happen, just in case.
		if ( data.length === 1 ) return; // Here is a normal behavior, not a paste action.
		
		popuNext(e.target, data);
		//for (i = 0; i < data.length; i++ ) { ins[i].value = data[i]; }
	},
	popuNext = function(el, data) {
		el.value = data[0]; // Apply first item to first input
		data = data.substring(1); // remove the first char.
		if ( el.nextElementSibling && data.length ) {
			// Do the same with the next element and next data
			popuNext(el.nextElementSibling, data);
		}
	};

ins.forEach(function(input) {
	/**
	 * Control on keyup to catch what the user intent to do.
	 * I could have check for numeric key only here, but I didn't.
	 */
	input.addEventListener('keyup', function(e){
		// Break if Shift, Tab, CMD, Option, Control.
		if (e.keyCode === 16 || e.keyCode == 9 || e.keyCode == 224 || e.keyCode == 18 || e.keyCode == 17) {
			 return;
		}
		
		// On Backspace or left arrow, go to the previous field.
		if ( (e.keyCode === 8 || e.keyCode === 37) && this.previousElementSibling && this.previousElementSibling.tagName === "INPUT" ) {
			this.previousElementSibling.select();
		} else if (e.keyCode !== 8 && this.nextElementSibling) {
			this.nextElementSibling.select();
		}
		
		// If the target is populated to quickly, value length can be > 1
		if ( e.target.value.length > 1 ) {
			splitNumber(e);
		}
	});
	
	/**
	 * Better control on Focus
	 * - don't allow focus on other field if the first one is empty
	 * - don't allow focus on field if the previous one if empty (debatable)
	 * - get the focus on the first empty field
	 */
	input.addEventListener('focus', function(e) {
		// If the focus element is the first one, do nothing
		if ( this === in1 ) return;
		
		// If value of input 1 is empty, focus it.
		if ( in1.value == '' ) {
			in1.focus();
		}
		
		// If value of a previous input is empty, focus it.
		// To remove if you don't wanna force user respecting the fields order.
		if ( this.previousElementSibling.value == '' ) {
			this.previousElementSibling.focus();
		}
	});
});

/**
 * Handle copy/paste of a big number.
 * It catches the value pasted on the first field and spread it into the inputs.
 */
in1.addEventListener('input', splitNumber);