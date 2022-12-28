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

const loginButton = document.getElementById("login-btn");
const signUpButton = document.getElementById("sign-up-btn");


// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

const uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            chrome.runtime.sendMessage({ message: 'sign-in' }, function (response) {
                window.user = authResult.user;
                if (response.message === 'success') {
                    window.location.replace('./main.html');
                }
            });
            return false;
        },
    },
    signInFlow: 'popup',
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        },
    ],
    tosUrl: "https://www.termsofservicegenerator.net/live.php?token=hnjiv0SH8AozMdR1lBm6W5TzoYNg1oo5",
    privacyPolicyUrl: "https://www.freeprivacypolicy.com/live/0b9928b2-0d38-4e11-ae46-4c7b24350e7c"
};

// If user, show main content
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        window.user = user;
        window.location.replace('./main.html');
    } else {
        // Show login
        ui.start('#sign-in-options', uiConfig);
    }
});


document.addEventListener('DOMContentLoaded', (event) => {
    
});