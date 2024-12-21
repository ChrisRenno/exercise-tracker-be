const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const addWorkout = require("./addWorkout");

exports.addWorkout = addWorkout.addWorkout;

admin.initializeApp();
const db = admin.firestore();

const allowedOrigins = ["http://localhost:5173", "https://your-hosted-domain.com"];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

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

// Function to retrieve all workouts with a specific user id from Firestore
exports.getWorkouts = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    // Handle preflight request
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }
  try {
    const snapshot = await db.collection("workouts").get();
    const data = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});
exports.getWorkoutsByUserId = functions.https.onRequest((req, res) => {
  cors(corsOptions)(req, res, async () => {
    if (req.method === "OPTIONS") {
      // Handle preflight request
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.status(204).send("");
      return;
    }
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).send("User ID is required");
      }

      const snapshot = await db.collection("workouts")
          .where("userID", "==", userId).get();
      const data = snapshot.docs.map((doc) => doc.data());
      res.status(200).json(data);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  });
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
