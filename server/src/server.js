import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log("=================================");
console.log("ENVIRONMENT VARIABLES");
console.log("Current directory:", process.cwd());
console.log("PORT:", process.env.PORT);
console.log("BACKEND_URL:", process.env.BACKEND_URL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log(
  "CHAPA_SECRET_KEY:",
  process.env.CHAPA_SECRET_KEY
    ? "LOADED"
    : "MISSING"
);
console.log(
  "CHAPA_PUBLIC_KEY:",
  process.env.CHAPA_PUBLIC_KEY
    ? "LOADED"
    : "MISSING"
);
console.log("=================================");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});