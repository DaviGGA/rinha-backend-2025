import mongoose from "mongoose";

export async function connectDatabase() {
  mongoose.connection.on("close", () => {
    console.log("Mongoose connection closed.")
  })

  mongoose.connection.on("error", error => {
    console.log("Couldn't connect to Mongo database: ", error)
  })

  mongoose.connection.on('connected', () => {
    console.log("Successfully conected to your Mongo database.")
});

  await mongoose.connect(process.env.MONGO_URI ?? "")
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

