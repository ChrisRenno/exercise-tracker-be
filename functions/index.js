const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const addWorkout = require("./addWorkout");
const getWorkoutsByUserId = require("./getWorkoutsByUserId");
const getSingleWorkout = require("./getSingleWorkout");

exports.addWorkout = addWorkout.addWorkout;
exports.getWorkoutsByUserId = getWorkoutsByUserId.getWorkoutsByUserId;
exports.getSingleWorkout = getSingleWorkout.getSingleWorkout;

const db = admin.firestore();

// Function to add JSON data to Firestore
exports.addJsonToDb = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body;
    await db.collection("testBlob").add(data);
    res.status(200).send("Data added successfully", res);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Function to retrieve JSON data from Firestore
exports.getJsonFromDb = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.collection("testBlob").get();
    const data = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Function to retrieve user specific data
exports.getUserData = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const uid = data.uid;

  if (!uid) {
    // eslint-disable-next-line max-len
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid UID.");
  }

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      // eslint-disable-next-line max-len
      throw new functions.https.HttpsError("not-found", "User document does not exist.");
    }

    return userDoc.data();
  } catch (error) {
    throw new functions.https.HttpsError("unknown", error.message, error);
  }
});
