const Firestore = require("../services/firebaseFirestore");
const db = new Firestore();

// Below recommended for cloud functions to format console logs
require("firebase-functions/logger/compat");

class User {
    constructor() {}

    /**
     * @desc makes claimed code to true in user object in db
     * @param {String} code invite code
     * @param {String} userID user ID
     */
    static async redeemInviteCode(code, userID) {
        const matches = await User.findUserByUserID(
            userID, "users",
        );

        const success = await db.updateDocument(
            matches,
            "users",
            {
                "claimedInvite": true,
            },
        );
        if (success) {
            return success;
        } else {
            console.error(`Error - SEV 2, Model Error - fn: redeemInviteCode
                - Error redeeming: ${userID} with code ${code}`);
            return null;
        }
    }

    /**
     * @desc check if user has claimed invite
     * @param {String} userID user ID
     */
    static async hasRedeemedInvite(userID) {
        const matches = await db.filterCollectionWithMultipleWhereClause(
            "users",
            ["id", "claimedInvite"],
            [userID, true],
            ["==", "=="],
        );
        if (matches.length > 0) {
            return matches;
        } else if (matches.length == 0) {
            return null;
        } else {
            return null;
        }
    }

    /**
     * @desc Validates invite codes
     * @param {String} code Checks database if invite code exists
     */
    static async inviteCodeValid(code) {
        // TODO: Map invite codes to email addresses
        const matches = await db.filterCollectionWithWhereClause(
            "invite-codes",
            "code",
            code,
            "==",
        );
        if (matches.length == 1) {
            return true;
        } else if (matches.length > 1) {
            // Big problem more than one code found
            console.error(`Error - SEV 2, Model Error - fn: inviteCodeValid
                - More than one code ${code} - er: ${null}`);
            return false;
        } else {
            // Matches == 0 (Code not found), or something else
            return false;
        }
    }

    /**
     * @desc Finds a user by their user ID and returns user data
     * @param {String} userID - The user's user ID
     * @param {String} collection - The collection in firebase to get from
     * @return {Object | Null} user info object if user found or null otherwise
     */
    static async findUserByUserID(userID, collection = "users") {
        const matches = await db.filterCollectionWithWhereClauseWithID(
            collection,
            "id",
            userID,
            "==",
        );

        if (matches.length == 1) {
            // Exactly what we want, one user found for UserID
            const user = matches[0];
            return user;
        } else if (matches.length > 1) {
            // Big problem more than one user for UserID
            console.error(`Error - SEV 2, Model Error - fn: findUserByUserID
                - More than one user for userID ${userID} - er: ${null}`);
            return null;
        } else {
            // Matches == 0 (No user found), or something else
            return null;
        }
    }
}

module.exports = User;
