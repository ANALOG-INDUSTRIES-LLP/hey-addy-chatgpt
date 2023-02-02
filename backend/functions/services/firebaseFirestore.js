const admin = require("firebase-admin");
const serviceAccount = require("../config/firebaseServiceAcc.json");
const functions = require("firebase-functions");
const {firebaseDatabaseURL} = functions.config().fbase.database.url;

// Below recommended for cloud functions to format console logs
require("firebase-functions/logger/compat");

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

    /**
     * @desc Filters a collection using where clause and returns the results
     * @param {String} collection - The name of the collection
     * @param {String} filterKey - The field name/key to filter by
     * @param {String} filterData - The data to match on the field
     * @param {String} operation - The firebase query operator to use in where
     * clause example "==", "<=", ">" more details here:
     * https://firebase.google.com/docs/firestore/query-data/queries#query_operators
     * @return {Array} a list of documents that match the filter
     */
    async filterCollectionWithWhereClause(collection, filterKey, filterData,
        operation) {
        return await db.collection(collection)
            .where(filterKey, operation, filterData).get()
            .then((querySnapshot) => {
                return querySnapshot.docs.map((doc) => doc.data());
            }).catch((error) => {
                console.error(`Error - Firebase Error - fn:
                    filterCollectionWithWhereClause - Error getting documents -
                    er: ${error}`);
                throw error;
            });
    }

    /**
     * @desc Filters a collection using where clause and returns the results
     * @param {String} collection - The name of the collection
     * @param {String} filterKey - The field name/key to filter by
     * @param {String} filterData - The data to match on the field
     * @param {String} operation - The firebase query operator to use in where
     * clause example "==", "<=", ">" more details here:
     * https://firebase.google.com/docs/firestore/query-data/queries#query_operators
     * @return {Array} a list of documents that match the filter
     */
    async filterCollectionWithWhereClauseWithID(collection, filterKey, filterData,
        operation) {
        return await db.collection(collection)
            .where(filterKey, operation, filterData).get()
            .then((querySnapshot) => {
                return querySnapshot.docs.map((doc) => doc.id);
            }).catch((error) => {
                console.error(`Error - Firebase Error - fn:
                    filterCollectionWithWhereClauseWithID - Error
                    getting documents - er: ${error}`);
                throw error;
            });
    }

    /**
     * @desc Add a document to a collection
     * @param {Object} document - The document object
     * @param {String} collection - The collection name
     * @return {Object} Object containing the following attributes:
     * sucess(true or false), docID(The string ID of the document added)
     */
    async addDocumentToCollection(document, collection) {
        return await db.collection(collection).add(document)
            .then((data) => {
                return {
                    success: true,
                    docID: data.id,
                };
            }).catch((error) => {
                console.error(`Error - Firebase Error - fn:
                    addDocumentToCollection - Error adding document to collection.
                    Document: ${JSON.stringify(document)},
                    collection: ${collection} - er: ${error}`);
                throw error;
            });
    }

    /**
     * @desc Update a document in a collection
     * @param {Object} documentId - The document object
     * @param {String} collection - The collection name
     * @param {Object} infoToUpdate - The info to update
     * @return {Object} Object containing the following attributes:
     * sucess(true or false), docID(The string ID of the document added)
     */
    async updateDocument(documentId, collection, infoToUpdate) {
        return await db.collection(collection).doc(documentId)
            .update(
                infoToUpdate,
            ).then((data) => {
                return {
                    success: true,
                };
            }).catch((error) => {
                console.error(`Error - Firebase Error - fn:
                    updateDocument - Error updating document in collection.
                    Document: ${documentId},
                    collection: ${collection} - er: ${error}`);
                throw error;
            });
    }

    /**
     * @desc Filters a collection using where clause and returns the results
     * @param {String} collection - The name of the collection
     * @param {String} filterKey - The field name/key to filter by
     * @param {String} filterData - The data to match on the field
     * @param {String} operation - The firebase query operator to use in where
     * @param {String} numberOfWheres - Number of where clauses
     * clause example "==", "<=", ">" more details here:
     * https://firebase.google.com/docs/firestore/query-data/queries#query_operators
     * @return {Array} a list of documents that match the filter
     */
    async filterCollectionWithMultipleWhereClause(collection, filterKey, filterData,
        operation) {
        let col = await db.collection(collection);
        for (let i = 0; i < filterKey.length; i++) {
            col = col.where(filterKey[i], operation[i], filterData[i]);
        }
        return col.get().then((querySnapshot) => {
            return querySnapshot.docs.map((doc) => doc.data());
        }).catch((error) => {
            console.error(`Error - Firebase Error - fn:
                    filterCollectionWithWhereClause - Error getting documents -
                    er: ${error}`);
            throw error;
        });
    }

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
}

module.exports = Firestore;
