import { __prod__ } from "./constants";
import { Options } from "@mikro-orm/core";
import path from "path";

import { User } from "./entities/User";
import { Challenge } from "./entities/Challenge";
import { Game } from "./entities/Game";
import { Wallet } from "./entities/Wallet";
import { Scores } from "./entities/Scores";
import { Transaction } from "./entities/Transaction";
import { Message } from "./entities/Message";
import { Conversation } from "./entities/Conversation";
import { Notification } from "./entities/Notification";

const config: Options = {
  allowGlobalContext: true,
  migrations: {
    path: path.join(__dirname, "dist/migrations"),
    pathTs: path.join(__dirname, "./migrations"),
    glob: "!(*.d).{js,ts}",
  },
  entities: [User, Notification,Challenge, Game, Wallet, Scores, Transaction, Conversation, Message],
  dbName: process.env.DATABASE_NAME,
  type: "postgresql",
  user: process.env.DATABASE_USER,
  password:process.env.DATABASE_PASSWORD,
  debug: !__prod__,
};

export default config;
