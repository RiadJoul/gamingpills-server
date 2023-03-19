import { User } from "../entities/User";
import { MyContext } from "../types";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Mutation,
  Publisher,
  PubSub,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { CLIENT, COOKIE_NAME, RESET_PASSWORD_EMAIL_PREFIX, SERVER, VERIFY_EMAIL_PREFIX } from "../constants";
import { InvalidUsernames } from "../InvalidUsernames";
import { Authentication } from "../middelware/Authentication";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { Wallet } from "../entities/Wallet";
import { validateAge } from "../utils/ValidateAge";
import { validatePassword } from "../utils/validatePasswordStrenght";
import { validateEmail } from "../utils/validateEmail";
import { createWriteStream } from "fs";
import { FileUpload } from "graphql-upload";
import path from "path";
import { Notification } from "../entities/Notification";
import { Challenge } from "../entities/Challenge";
import { Mode, Status } from "../enums/Challenge";
import { FeedResponse } from "./Responses/FeedResponse";
import { MatchesResponse } from "./Responses/MatchesResponse";
import { generateString } from "../utils/GenerateString";
import { Game } from "../entities/Game";
import { sendEmail } from "../utils/EmailSender";
import { UserStats } from "./Responses/UserStats";
import { Role } from "../enums/Roles";
import { Admin } from "../middelware/Admin";
import { SignUpResponse } from "./Responses/SignUpResponse";
const GraphQLUpload = require('graphql-upload/GraphQLUpload.js');


@Resolver()
export class UserResolver {
  //TODO: remove this PROD
  @Mutation(() => GeneralResponse)
  async seedAdmin(
    @Ctx() { req, em }: MyContext
  ): Promise<GeneralResponse> {

    //check if someone has that uuid
    do {
      var uuid = uuidv4();
      var idExists = await em.find(User, { id: uuid });
    } while (idExists.length != 0);

    const hashedPassword = await argon2.hash('password1');

    const admin = em.create(User, {
      id: uuid,
      role: Role.ADMIN,
      username: 'Admin',
      firstName: 'Riad',
      lastName: 'Joul',
      birthDate: "2000-09-06T14:56:15.000Z",
      email: "admin@gmail.com",
      emailVerified: true,
      password: hashedPassword,
    } as any);
    await em.persistAndFlush(admin);

    req.session.userId = admin.id;

    return {
      success: true,
    };
  }
  //Explore Query
  @Query(() => FeedResponse, { nullable: true })
  @UseMiddleware(Authentication)
  async feed(
    @Ctx() { req, em }: MyContext
  ): Promise<FeedResponse> {
    const date = new Date();
    // last seen is 1 hour
    date.setHours(date.getHours() - 1);
    const onlineUsers = await em.find(User, {
      role: Role.PLAYER,
      banned: false,
      lastSeen: { $gte: new Date(date) },
      $ne: { id: req.session.userId },
    } as any);

    const myChallenges = await em.find(Challenge, {
      $or: [
        {
          status: Status.PENDING,
          homePlayer: req.session.userId
        },
        {
          status: Status.ACTIVE,
          homePlayer: req.session.userId
        },
        {
          status: Status.ACTIVE,
          awayPlayer: req.session.userId
        }
      ]
    })

    const challenges = await em.find(Challenge, {
      $and: [
        {
          mode: Mode.OPEN,
          status: Status.PENDING
        },
      ]
    }, { orderBy: [{ createdAt: QueryOrder.ASC }] });

    const games = await em.find(Game, {});


    return {
      onlineUsers: onlineUsers,
      games: games,
      myChallenges: myChallenges,
      challenges: challenges
    }
  }

  //Matches Query
  @Query(() => MatchesResponse, { nullable: true })
  @UseMiddleware(Authentication)
  async matches(
    @Ctx() { req, em }: MyContext
  ): Promise<MatchesResponse> {
    const activeChallenges = await em.find(Challenge, {
      status: Status.ACTIVE,
      $or: [
        { homePlayer: req.session.userId },
        { awayPlayer: req.session.userId },
      ],
    }, { orderBy: [{ createdAt: QueryOrder.DESC }] });

    const invites = await em.find(Challenge, {
      status: Status.PENDING,
      awayPlayer: req.session.userId,
    }, { orderBy: [{ createdAt: QueryOrder.DESC }] });

    const finishedChallenges = await em.find(Challenge, {
      status: Status.FINISHED,
      $or: [
        { homePlayer: req.session.userId },
        { awayPlayer: req.session.userId },
      ],
    }, { orderBy: [{ createdAt: QueryOrder.DESC }] });
    return {
      activeChallenges: activeChallenges,
      invites: invites,
      finishedChallenges: finishedChallenges
    }
  }

  //returns the Authenticated user
  @Query(() => User, { nullable: true })
  @UseMiddleware(Authentication)
  async AuthenticatedUser(@Ctx() { req, em }: MyContext,
  ) {
    const user = await em.findOne(User, { id: req.session.userId }, {
      populate: ['Wallet'],
    });
    return user;
  }

  //returns all users
  @Query(() => [User])
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  //getting a user with id
  @Query(() => User, { nullable: true })
  @UseMiddleware(Authentication)
  user(
    @Arg("id", () => String) id: string,
    @Ctx() { em }: MyContext
  ): Promise<User | null> {
    return em.findOne(User, { id });
  }


  @Mutation(() => SignUpResponse)
  async register(
    @Arg("username") username: string,
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("birthDate") birthDate: Date,
    @Ctx() { req, em }: MyContext
  ): Promise<SignUpResponse> {
    const min = 3;
    const max = 16;

    const isUsernameTaken = await em.findOne(User, { username: username })
    const isEmailTaken = await em.findOne(User, { email: email })

    if (isUsernameTaken) {
      return {
        errors: [
          {
            field: "Username", message: `The username ${username} is already taken`
          }
        ]
      }
    }
    if (isEmailTaken) {
      return {
        errors: [
          {
            field: "Account", message: "You already have an account please sign in"
          }
        ]
      }
    }
    //username validation
    if (InvalidUsernames.includes(username)) {
      return {
        errors: [
          { field: "Username", message: "You cannot use this username" },
        ],
      };
    }
    if (username.length < min || username.length > max) {
      return {
        errors: [
          {
            field: "Username",
            message:
              `Your username must have a minimum of ${min} characters and maximum ${max} characters`,
          },
        ],
      };
    }


    //firstName validation
    if (firstName.length < min) {
      return {
        errors: [
          {
            field: "First name",
            message: "First name cannot be less than 3 characters",
          },
        ],
      };
    }
    //lastName validation
    if (lastName.length < min) {
      return {
        errors: [
          {
            field: "Last name",
            message: "Last name cannot be less than 3 characters",
          },
        ],
      };
    }

    if (!validateEmail(email)) {
      return {
        errors: [{ field: "Email", message: "Not a valid email" }],
      };
    }

    if (!validatePassword(password)) {
      return {
        errors: [
          {
            field: "Password",
            message:
              "Your password should have atleast 8 characters",
          },
        ],
      };
    }

    //birthdate
    if (!validateAge(birthDate)) {
      return {
        errors: [
          {
            field: "Under 18",
            message:
              "You cannot use our platform if you are under 18 years old, please read our Terms and services before signing up",
          },
        ],
      };
    }

    //check if someone has that uuid
    do {
      var uuid = uuidv4();
      var idExists = await em.find(User, { id: uuid });
    } while (idExists.length != 0);

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      id: uuid,
      role: Role.PLAYER,
      username: username,
      firstName: firstName,
      lastName: lastName,
      birthDate: birthDate,
      email: email,
      password: hashedPassword,
    } as User);
    await em.persistAndFlush(user);
    //creating a wallet
    const wallet = em.create(Wallet, {
      user: user,
    } as Wallet);

    await em.persistAndFlush(wallet);

    req.session.userId = user.id;

    return { user };
  }


  @Mutation(() => User || null)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: any
  ): Promise<User | null> {
    const user: User = await em.findOne(User, { username: username });
    if (!user) {
      return null;
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return null;
    }
    // store user id in session with redis
    req.session.userId = user.id;

    wrap(user).assign({
      lastSeen: new Date(),
    });
    return user;
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async updateProfile(
    @Arg("file", () => GraphQLUpload) file: FileUpload,
    @Ctx() { em, req }: MyContext
  ): Promise<GeneralResponse> {

    const { createReadStream, filename } = file;

    var ext = path.extname(filename || '').split('.');
    const fileType = ext[ext.length - 1];
    if (fileType != 'gif' && fileType != 'jpeg' && fileType != 'png' && fileType != 'jpg') {
      return { errors: [{ field: 'Error', message: 'This is not a valid file, please upload a png, jpeg or a gif file' }] }
    }

    const user = await em.findOne(User, { id: req.session.userId })
    const id = uuidv4();

    try {
      await new Promise(res =>
        createReadStream()
          .pipe(createWriteStream(path.join(__dirname, "../public/images/avatars", id)))
          .on("close", res)
      );
      wrap(user).assign({
        avatar: SERVER + '/images/avatars/' + id
      });
    }

    catch (err) {
      return {
        errors: [{ field: 'Error', message: 'An Error has occured please try again later' }]
      }
    }
    return { success: true }
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async updateUser(
    @Arg("psnId") psnId: string,
    @Arg("xboxId") xboxId: string,
    @Arg("paypal") paypal: string,
    @Ctx() { req, em }: MyContext
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: req.session.userId });

    if (paypal && !validateEmail(paypal)) {
      return {
        errors: [
          { field: "Paypal Email", message: "not a valid email address" }
        ]
      };
    }

    wrap(user).assign({
      psnId: psnId,
      xboxId: xboxId,
      paypal: paypal,
    });

    return {
      success: true,
    };
  }

  @Query(() => UserStats)
  @UseMiddleware(Authentication)
  async playerStats(
    @Arg("id") id: string,
    @Ctx() { em }: MyContext
  ): Promise<UserStats | null> {
    if (!id) return null;
    const player = await em.findOne(User, { id: id })
    if (!player) return null;
    const matches = await em.count(Challenge, {
      status: Status.FINISHED,
      $or: [
        { homePlayer: player.id },
        { awayPlayer: player.id },
      ],
    });

    const wins = await em.count(Challenge, {
      status: Status.FINISHED,
      $or: [
        { homePlayer: player.id },
        { awayPlayer: player.id },
      ],
      winner: player.id
    });

    const losses = await em.count(Challenge, {
      status: Status.FINISHED,
      $or: [
        { homePlayer: player.id },
        { awayPlayer: player.id },
      ],
      $not: { winner: player.id }
    });

    return {
      matches: matches,
      wins: wins,
      losses: losses
    }
  }

  //send verification email
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async sendVerificationCode(
    @Ctx() { em, req, redis }: MyContext
  ): Promise<GeneralResponse> {
    //send token in email
    const user = await em.findOne(User, { id: req.session.userId })
    if (user!.emailVerified) return { errors: [{ field: 'verified', message: "email already verified" }] }
    const token = generateString(20).toUpperCase();
    //store the token in redis for verification
    redis.set(VERIFY_EMAIL_PREFIX + token, user!.id, 'EX', 7200); //expires in 1 hour
    await sendEmail(user!, 'Verify Account Email', 'Click on the button below to verify your email', 'Verify Email', `${CLIENT}/${VERIFY_EMAIL_PREFIX}/${token}`)
    return { success: true }
  }


  //verify email
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async verifyEmail(
    @Arg('token') token: string,
    @Ctx() { redis, em }: MyContext,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {

    const userId = await redis.get(VERIFY_EMAIL_PREFIX + token)
    if (!userId) {
      return {
        errors: [
          { field: 'token', message: 'expired token' }
        ]
      }
    }
    const user = await em.findOne(User, { id: userId })
    if (user!.emailVerified) {
      return {
        errors: [
          { field: 'verified', message: 'email already verified' }
        ]
      }
    }
    wrap(user).assign({
      emailVerified: true
    });
    do {
      var uuid = uuidv4();
      var notificationIdExist = await em.findOne(Notification, { id: uuid });
  } while (notificationIdExist);
    const notification: Notification = em.create(Notification, {
      id:uuid,
      user: user,
      title: "Email",
      message: "Your email has been verified"
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSoc
    await publish(notification)

    return { success: true }
  }


  //send reset password email
  @Mutation(() => GeneralResponse)
  async sendResetPasswordEmail(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ): Promise<GeneralResponse> {
    if (!validateEmail(email)) {
      return {
        errors: [
          { field: "Email", message: "Invalid Email" }
        ]
      }
    }
    const user = await em.findOne(User, { email: email })
    if (!user) return {
      errors: [
        { field: "Account", message: "You do not have a Gamingpills account" }
      ]
    }
    //send token in email
    const token = generateString(20).toUpperCase();
    //store the token in redis for verification
    redis.set(RESET_PASSWORD_EMAIL_PREFIX + token, user!.id, 'EX', 7200); //expires in 1 hour
    await sendEmail(user, 'Reset your password', 'You can reset your password with the following link. <br/> if you did not request a password reset ignore this email.', 'Reset Password', `${CLIENT}/${RESET_PASSWORD_EMAIL_PREFIX}/${token}`)
    return { success: true }
  }

  //reset password
  @Mutation(() => GeneralResponse)
  async resetPassword(
    @Arg('token') token: string,
    @Arg("newPassword") newPassword: string,
    @Arg("confirmPassword") confirmPassword: string,
    @Ctx() { redis, em }: MyContext
  ): Promise<GeneralResponse> {
    const userId = await redis.get(RESET_PASSWORD_EMAIL_PREFIX + token)
    if (!userId) {
      return {
        errors: [
          { field: 'token', message: 'expired token' }
        ]
      }
    }
    if (!validatePassword(newPassword)) {
      return {
        errors: [
          {
            field: "Password",
            message:
              "Your password should have atleast 8 characters, one letter and one number",
          },
        ],
      };
    }
    if (newPassword != confirmPassword)
      return {
        errors: [{ field: "Error", message: "passwords do not match" }],
      };
    //
    const newHashedpassword = await argon2.hash(newPassword);
    const user = await em.findOne(User, { id: userId })
    wrap(user).assign({
      password: newHashedpassword,
    });

    return { success: true }
  }

  // change password
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async changePassword(
    @Arg("password") password: string,
    @Arg("newPassword") newPassword: string,
    @Arg("confirmPassword") confirmPassword: string,
    @Ctx() { req, em }: MyContext
  ): Promise<GeneralResponse> {
    if (!validatePassword(password)) {
      return {
        errors: [
          {
            field: "Password",
            message:
              "Your password should have atleast 8 characters, one letter and one number",
          },
        ],
      };
    }
    const user = await em.findOne(User, { id: req.session.userId });
    const valid = await argon2.verify(user!.password, password);
    if (!valid)
      return {
        errors: [{ field: "failed", message: "your password is incorrect" }],
      };
    if (newPassword != confirmPassword)
      return {
        errors: [{ field: "Error", message: "passwords do not match" }],
      };
    //
    const newHashedpassword = await argon2.hash(newPassword);

    wrap(user).assign({
      password: newHashedpassword,
    });

    return { success: true };
  }


  //logout user
  @Mutation(() => Boolean)
  @UseMiddleware(Authentication)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
        return true;
      })
    );
  }



  @Query(() => [User])
  @UseMiddleware(Authentication)
  async searchPlayer(
    @Ctx() { em, req }: MyContext,
    @Arg("username") username: string
  ): Promise<User[]> {
    const reg = new RegExp(username);
    return await em.find(User, {
      username: reg,
      role: Role.PLAYER,
      $ne: { id: req.session.userId },
    } as any);
  }

  @Query(() => User)
  @UseMiddleware(Authentication)
  async player(
    @Ctx() { em }: MyContext,
    @Arg("id") id: string
  ): Promise<User | null> {
    return await em.findOne(User, {
      id: id,
      role: Role.PLAYER,
    } as any);
  }

}