const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors");

const db = admin.firestore();
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

exports.deleteWorkout = functions.https.onRequest((req, res) => {
  cors(corsOptions)(req, res, async () => {
    const workoutId = req.query.id;

    if (!workoutId) {
      return res.status(400).send({message: "Invalid workout ID", query: req});
    }

    try {
      const workoutRef = db.collection("workouts").doc(workoutId);
      const doc = await workoutRef.get();

      if (!doc.exists) {
        return res.status(404).send({message: "Workout not found"});
      }

      await workoutRef.delete();
      res.status(200).send({message: "Workout deleted successfully"});
    } catch (error) {
      res.status(500)
          .send({message: "Internal Server Error", error: error.message});
    }
  });
});
