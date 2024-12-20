const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

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

exports.addWorkout = functions.https.onRequest((req, res) => {
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
      // Check for Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).send("Unauthorized: No token provided");
      }

      // Verify the ID token
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      if (!decodedToken) {
        return res.status(403).send("Unauthorized: Invalid token");
      }

      // Proceed with adding the workout
      const data = req.body;
      await admin.firestore().collection("workouts").add(data);
      res.status(200).send("Workout added successfully");
    } catch (error) {
      console.error("Error adding workout:", error);
      if (error.code === "auth/argument-error" ||
        error.code === "auth/id-token-expired") {
        res.status(401).send("Unauthorized: Invalid or expired token");
      } else {
        res.status(500).send(error.toString());
      }
    }
  });
});

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

// function to add a workout to the database -- old version
// exports.addWorkout = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       const data = req.body;
//       await db.collection("workouts").add(data);
//       res.status(200).send("Workout added successfully");
//     } catch (error) {
//       res.status(500).send(error.toString());
//     }
//   });
// });

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
  try {
    const snapshot = await db.collection("workouts").get();
    const data = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});
exports.getWorkoutsByUserId = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    const snapshot = await db.collection("workouts")
        .where("userId", "==", userId).get();
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
