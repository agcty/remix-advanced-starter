import fs from "node:fs"
import path from "node:path"
import { config } from "dotenv"
import { execaCommand } from "execa"
// import { initEnv } from "~/utils/env.server"

config({ path: path.join(process.cwd(), ".env.test") })

export async function setup() {
  try {
    console.log("Starting test environment setup...")

    // initEnv()

    console.log("Creating new database...")

    await execaCommand("pnpm db:push", {
      stdio: "inherit",
    })

    console.log("Test environment setup complete.")
  } catch (error) {
    console.error("Error during test environment setup:", error)
    throw error
  }
}

export async function teardown() {
  try {
    console.log("Cleaning up local test files and databases...")

    const dbPath = path.join(process.cwd(), process.env.DATABASE_URL)

    if (fs.existsSync(dbPath)) {
      console.log(`Deleting database file at ${dbPath}`)
      fs.unlinkSync(dbPath)
      console.log("Database file deleted successfully.")
    } else {
      console.log(`Database file not found at ${dbPath}. Nothing to delete.`)
    }

    console.log("Resetting database just to make sure...")
    // Importing the function dynamically to make sure env is initialized
    const { teardown: resetDb } = await import("other/seed")
    await resetDb()

    console.log("Cleanup complete.")
  } catch (error) {
    console.error("Error during cleanup:", error)
  }
}
