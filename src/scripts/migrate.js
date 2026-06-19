import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { achievementsData } from "../pages/AchievementsData.js";

async function migrateData() {
  console.log("Starting migration...");
  const achievementsCol = collection(db, "achievements");
  
  for (const item of achievementsData) {
    try {
      // Remove the hardcoded 'id' property so Firestore creates a random one
      const { id, ...dataToUpload } = item;
      
      // Ensure there is an images array or property that fits our model
      if (!dataToUpload.images) {
        dataToUpload.images = []; // Provide default empty array if none exists
      }
      
      // Add order property based on the original id to maintain sorting
      dataToUpload.order = id;

      const docRef = await addDoc(achievementsCol, dataToUpload);
      console.log(`Successfully added achievement: ${item.title} with ID: ${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  console.log("Migration completed!");
  process.exit(0);
}

migrateData();
