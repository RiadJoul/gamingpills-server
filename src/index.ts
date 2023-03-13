import 'dotenv-safe/config'
import { MikroORM } from "@mikro-orm/core";
import { CLIENT, COOKIE_NAME, SERVER, __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import express from "express";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import connectReddis from "connect-redis";
import session from "express-session";
import { ChallengeResolver } from "./resolvers/challenge";
import { GameResolver } from "./resolvers/game";
import { WalletResolver } from "./resolvers/wallet";
const graphqlUploadExpress = require('graphql-upload/graphqlUploadExpress.js');
import path from "path";
import { FileHelper } from './utils/FileManager';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core/dist/plugin/drainHttpServer";
import { AdminResolver } from './resolvers/admin';
import { challengeScheduler } from './schedulers/challengeScheduler';
import { User } from './entities/User';
import { ConversationResolver } from './resolvers/conversation';


const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  if (__prod__) await orm.getMigrator().up();
  // server
  const app = express();


  const RedisStore = connectReddis(session);
  const redis = new Redis();

  const sessionMiddleware = session({
    name: COOKIE_NAME,
    store: new RedisStore({
      client: redis,
      disableTouch: true,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      sameSite: "lax", // csrf
      secure: __prod__, // cookie only works in https,
      domain: __prod__ ? SERVER : undefined,
    },
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET!,
    resave: false,
  });
  // sessions
  app.use(
    sessionMiddleware
  );


  const schema = await buildSchema({
    resolvers: [
      AdminResolver,
      UserResolver,
      ChallengeResolver,
      GameResolver,
      WalletResolver,
      ConversationResolver
    ],
    validate: false,
  })


  const httpServer = createServer(app);
  // Creating the WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',

  });


  const serverCleanup = useServer({
    schema,
    onConnect: async (ctx) => {
      if (ctx.connectionParams) {
        const id = ctx.connectionParams.id as string;
        const user = await orm.em.findOne(User, { id: id });
        if (!user) {
          throw new Error("Not Authenticated")
        }
        else {
          console.log("USER CONNECTED", user!.id)
        }
      }
    },
    context: async (ctx) => {
      // This will be run every time the client sends a subscription request
      if (ctx.connectionParams) {
        return await ctx.connectionParams.id;
      }
    },

  }, wsServer);



  const apolloServer = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    context: ({ req, res }) => ({ em: orm.em, req, res, redis }),


    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // subscriptions do not work on this graphQL playground
      ApolloServerPluginLandingPageGraphQLPlayground,

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      // ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });



  await apolloServer.start();




  app.use(graphqlUploadExpress({ maxFileSize: 50 * 1024 * 1024, maxFiles: 1 }));
  app.use(express.static(path.join(__dirname, 'public')));
  //apollo applies middleware for our express server
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: CLIENT,
      credentials: true,
    },
  });

  //this file creates the public folder if it does not exist to store users images
  FileHelper();

  //server starts
  httpServer.listen(parseInt(process.env.PORT!), () => { });

  //schedulers
  challengeScheduler(orm.em);


};


main().catch((err) => {
  console.error(err);
});