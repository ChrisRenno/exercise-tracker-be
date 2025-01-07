const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors");

const db = admin.firestore();

const allowedOrigins = ["http://localhost:5173", "https://us-central1-weights-tss.cloudfunctions.net"];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

exports.deleteWorkout = functions.https.onRequest((req, res) => {
  cors(corsOptions)(req, res, async () => {
    const workoutId = req.query.id;
    const fileName = req.query.fileName || null;
    const folderName = req.query.folderName || null;

    if (!workoutId) {
      return res.status(400).send({message: "Invalid workout ID", query: req});
    }

    try {
      const workoutRef = db.collection("workouts").doc(workoutId);
      const doc = await workoutRef.get();

      if (fileName) {
        const deleteRef = admin.storage().bucket("weights-tss.appspot.com")
            .file(`workouts/${folderName}/${fileName}`);

        await deleteRef.delete();
      }

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
