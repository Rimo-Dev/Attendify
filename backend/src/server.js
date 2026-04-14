const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { ensureSeedData } = require("./data/seed");

async function startServer() {
  await connectDb();
  await ensureSeedData();

  app.listen(env.port, () => {
    console.log(`Attendify backend running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Attendify backend:", error);
  process.exit(1);
});
