const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Deletes a workout from the Firestore database.
 * @param {string} workoutId - The ID of the workout to delete.
 */
async function deleteWorkout(workoutId) {
  try {
    await db.collection("workouts").doc(workoutId).delete();
    console.log(`Workout with ID: ${workoutId} has been deleted.`);
  } catch (error) {
    console.error("Error deleting workout:", error);
  }
}

module.exports = deleteWorkout;
