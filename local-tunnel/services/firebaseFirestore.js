const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseServiceAcc.json");
const {firebaseDatabaseURL} = process.env.FIREBASE_DB_URL;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: firebaseDatabaseURL,
    });
}

const db = admin.firestore();
db.settings({ignoreUndefinedProperties: true});

class Firestore {
    constructor() {}

    async getDocInCollection(collection, docId) {
        const docRef = await db.collection(collection)
            .doc(docId);
        const result = await docRef.get().then((doc) => {
            if (!doc.exists) {
                return undefined;
            }
            return doc.data();
        }).catch((error) => {
            console.error("Error: Approve Project Failed to get document " +
            "id " + docId + " error: ", JSON.stringify(error));
            return undefined;
        });
        return result;
    }

    async updateLocalTunnelURL(url) {
        let localTunnelUpdated = false;
        await db.collection("whereis")
            .doc("string-types")
            .update({
                "tunnel": url,
            }).then(() => {
                localTunnelUpdated = true;
            }).catch((error) => {
                console.error(
                    "Error fn:updateLocalTunnelURL failed" +
                    JSON.stringify(error),
                );
                localTunnelUpdated = false;
            });
        return localTunnelUpdated;
    }
}

module.exports = Firestore;
