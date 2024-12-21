const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

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
