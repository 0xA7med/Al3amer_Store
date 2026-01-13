import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql", // لاحظ أننا نستخدم dialect وليس driver
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});