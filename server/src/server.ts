import "dotenv/config";
import app from "./app";
import { initDb } from "./db";

const port = Number(process.env.PORT ?? 8080);

async function start() {
  try {
    await initDb();

    app.listen(port, () => {
      console.log(`Server listening on :${port}`);
    });
  } catch (err) {
    console.error("Failed to initialize database", err);
    process.exit(1);
  }
}

start();