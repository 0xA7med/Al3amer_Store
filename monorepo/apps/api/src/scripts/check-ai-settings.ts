import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { db } from "../db/index.js";
import { settings, aiSettings } from "../db/schema.js";

async function checkSettings() {
    try {
        const core = await db.query.settings.findFirst();
        console.log("Core Settings:", JSON.stringify(core, null, 2));
        
        const ai = await db.query.aiSettings.findFirst();
        console.log("AI Settings:", JSON.stringify(ai, null, 2));
    } catch (error) {
        console.error("Error checking settings:", error);
    }
    process.exit(0);
}

checkSettings();
