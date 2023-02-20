import { __prod__ } from "./constants";
import { User } from "./entities/User";
import { Options } from "@mikro-orm/core";
import path from "path";
import { Challenge } from "./entities/Challenge";
import { Game } from "./entities/Game";
import { Wallet } from "./entities/Wallet";
import { Scores } from "./entities/Scores";
import { Transaction } from "./entities/Transaction";

const config: Options = {
  allowGlobalContext: true,
  migrations: {
    path: path.join(__dirname, "dist/migrations"),
    pathTs: path.join(__dirname, "./migrations"),
    glob: "!(*.d).{js,ts}",
  },
  entities: [User, Challenge, Game, Wallet, Scores, Transaction],
  dbName: process.env.DATABASE_NAME,
  type: "postgresql",
  user: process.env.DATABASE_USER,
  password:process.env.DATABASE_PASSWORD,
  debug: !__prod__,
};

export default config;
