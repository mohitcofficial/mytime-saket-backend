import cloudinary from "cloudinary";
import app from "./app.js";
import { connectDB } from "./config/database.js";

connectDB();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

app.get("/", (req, res) => {
  res.send("<h1>Working Fine</h1>");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on PORT: ${process.env.PORT}`);
});
