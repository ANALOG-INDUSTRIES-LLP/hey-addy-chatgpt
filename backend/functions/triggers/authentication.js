const functions = require("firebase-functions");
const Firestore = require("../services/firebaseFirestore");

const db = new Firestore();

exports.addNewUserToDb = functions.auth.user().onCreate((user) => {
    const userObject = {
        id: user.uid,
        email: user.email,
        // name: user.displayName,
        claimedInvite: false,
    };
    db.addDocumentToCollection(
        userObject,
        "users",
    );
});
