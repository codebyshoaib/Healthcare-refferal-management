import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:
        process.env.NODE_ENV === "production" ||
        process.env.DB_HOST?.includes("supabase")
          ? { rejectUnauthorized: false }
          : false,
    };

const pool = new pg.Pool(poolConfig);

pool.on("connect", () => {
  console.error("Connected to the database");
});

pool.on("error", (err: Error) => {
  console.error("Database connection error", err);
  process.exit(-1);
});

export default pool;
