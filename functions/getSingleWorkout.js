const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
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

exports.getSingleWorkout = functions.https.onRequest((req, res) => {
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
      const workoutId = req.query.workoutId;
      if (!workoutId) {
        return res.status(400).send("Workout ID is required");
      }

      const doc = await db.collection("workouts").doc(workoutId).get();
      if (!doc.exists) {
        return res.status(404).send("Workout not found");
      }

      const data = doc.data();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  });
});
