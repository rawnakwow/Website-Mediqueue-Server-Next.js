require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const port = Number(process.env.PORT || 5001);
connectDB().then(()=>app.listen(port,()=>console.log(`MediQueue API running on http://localhost:${port}`))).catch(error=>{console.error("Failed to start API",error);process.exit(1);});
