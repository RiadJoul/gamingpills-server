import { Challenge } from "../entities/Challenge";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { v4 as uuidv4 } from "uuid";
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
import { ChallengeInput } from "./Inputs/ChallengeInput";
import { Mode, Platform, Status as ChallengeStatus } from "../enums/Challenge";
import { Status as TransactionStatus, Type } from "../enums/Transaction";
import { Authentication } from "../middelware/Authentication";
import { NoActiveOrPendingMatch } from "../middelware/NoActiveOrPendingMatch";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { Scores } from "../entities/Scores";
import { Wallet } from "../entities/Wallet";
import { calculateProfit } from "../utils/fee";
import { Authorization } from "../middelware/Authorization";
import { Transaction } from "../entities/Transaction";
import { EmailVerified } from "../middelware/EmailVerified";
import { Notification } from "../entities/Notification";
import { Game } from "../entities/Game";
import { GameMode } from "../entities/GameMode";
import { sendEmail } from "../utils/EmailSender";
import { CLIENT } from "../constants";
import { Conversation } from "../entities/Conversation";


@Resolver()
export class ChallengeResolver {

  //challenge
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Authorization)
  @UseMiddleware(EmailVerified)
  @UseMiddleware(NoActiveOrPendingMatch)
  async Challenge(
    @Arg("input") input: ChallengeInput,
    @Ctx() { req, em }: MyContext,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const homePlayer = await em.findOne(User, { id: req.session.userId });
    const awayPlayer = await em.findOne(User, { id: input.awayPlayerId });

    //balance check
    const wallet = await em.findOne(Wallet, { user: homePlayer });

    if (wallet!.balance < input.bet) {
      return {
        errors: [{ field: "Funds", message: "You do not have enough funds" }],
      };
    }

    if (input.platform == Platform.PS4 || input.platform == Platform.PS5) {
      if (homePlayer?.psnId == null || homePlayer.psnId == "") {
        return {
          errors: [
            { field: "PSN", message: "Please add your PSN in your profile" },
          ],
        };
      }
    }
    if (
      input.platform == Platform.XBOXONE ||
      input.platform == Platform.XBOXSERIES
    ) {
      if (homePlayer?.xboxId == null || homePlayer.xboxId == "") {
        return {
          errors: [
            {
              field: "XBOX gamertag",
              message: "Please add your Xbox gamertag in your profile",
            },
          ],
        };
      }
    }
    const game = await em.findOne(Game, { id: input.game })
    const gameMode = await em.findOne(GameMode, { id: input.gameMode })

    let balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance - input.bet,
    });
    //transaction
    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.NEGATIVE,
      user: homePlayer,
      amount: input.bet,
      description: game!.name + " Challenge",
    } as Transaction);

    await em.persistAndFlush(transaction);

    do {
      var uuid = uuidv4();
      var idExists = await em.find(Challenge, { id: uuid });
    } while (idExists.length != 0);



    const challenge: Challenge = em.create(Challenge, {
      id: uuid,
      status: ChallengeStatus.PENDING,
      mode: input.awayPlayerId ? Mode.CHALLENGE : Mode.OPEN,
      homePlayer: homePlayer,
      awayPlayer: awayPlayer,
      platform: input.platform,
      game: game,
      gameMode: gameMode,
      bet: input.bet,
      comment: input.comment,
    } as any);
    await em.persistAndFlush(challenge);

    if (awayPlayer) {
      //Notifications
      const notification: Notification = em.create(Notification, {
        user: awayPlayer,
        title: "Challenge",
        message: `${homePlayer!.username} has challenged you for a ${challenge.bet}$ game in ${challenge.game.name}`
      } as Notification)
      em.persistAndFlush(notification)
      // Publish event to the WebSocket server
      await publish(notification)

      //Email Notification
      await sendEmail(awayPlayer, `${homePlayer!.username} invited you`, `${homePlayer!.username} has invited you for a ${game?.name} challenge for $${challenge.bet} <br/> Do you have what it takes?`, "Go to gamingpills", `https://${CLIENT}/player/feed`)
    }

    return { success: true };
  }



  // Join a pending challenge
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(NoActiveOrPendingMatch)
  @UseMiddleware(EmailVerified)
  @UseMiddleware(Authorization)
  async JoinChallenge(
    @Arg("id") id: string,
    @Ctx() { req, em }: MyContext,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: req.session.userId });
    const challenge = await em.findOne(Challenge, { id: id });

    if (
      challenge?.platform == Platform.PS4 ||
      challenge?.platform == Platform.PS5
    ) {
      if (user?.psnId == null || user.psnId == "") {
        return {
          errors: [
            { field: "PSN", message: "Please add your PSN in your profile" },
          ],
        };
      }
    }
    if (
      challenge?.platform == Platform.XBOXONE ||
      challenge?.platform == Platform.XBOXSERIES
    ) {
      if (user?.xboxId == null || user.xboxId == "") {
        return {
          errors: [
            {
              field: "XBOX gamertag",
              message: "Please add your Xbox gamertag in your profile",
            },
          ],
        };
      }
    }

    if (!challenge || challenge.status != ChallengeStatus.PENDING)
      return {
        errors: [{ field: "Failed", message: "challenge was not found" }],
      };

    //balance check
    const wallet = await em.findOne(Wallet, { user: user });

    if (wallet!.balance < challenge.bet) {
      return {
        errors: [{ field: "Funds", message: "You do not have enough funds" }],
      };
    }

    let balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance - challenge.bet,
    });

    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.NEGATIVE,
      user: user,
      amount: challenge.bet,
      description: challenge.game.name + " Challenge",
    } as Transaction);
    await em.persistAndFlush(transaction);

    wrap(challenge).assign({
      status: ChallengeStatus.ACTIVE,
      awayPlayer: user,
    });

    const conversation = em.create(Conversation, {
      id: id,
      public: false,
      members: [challenge.homePlayer, challenge.awayPlayer!]
    });
    await em.populate(conversation, ['members']);
    em.persistAndFlush(conversation)


    //Notifications
    const notification: Notification = em.create(Notification, {
      user: challenge.homePlayer,
      title: "Challenge Accepted",
      message: `${user!.username} has accepted you challenge`
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    //send Email
    await sendEmail(challenge.homePlayer, `Challenge accepted`, `${challenge.awayPlayer!.username} has accepted your challenge for $${challenge.bet}`, "Go to gamingpills", `https://${CLIENT}/game/lobby/${challenge.id}`)
    return { success: true };
  }


  // GET Challenge
  @Query(() => Challenge, { nullable: true })
  @UseMiddleware(Authentication)
  async challenge(
    @Arg("id") id: string,
    @Ctx() { em }: MyContext
  ): Promise<Challenge | null> {
    return await em.findOne(Challenge, {
      id: id,
    });
  }

  // GET Authenticated player's disputed games
  @Query(() => [Challenge], { nullable: true })
  @UseMiddleware(Authentication)
  async playerDisputedChallenges(
    @Ctx() { req, em }: MyContext
  ): Promise<Challenge[] | null> {
    return await em.find(Challenge, {
      status: ChallengeStatus.DISPUTED,
      $or: [
        { homePlayer: req.session.userId },
        { awayPlayer: req.session.userId },
      ],
    }, { orderBy: [{ createdAt: QueryOrder.DESC }] });
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)

  async uploadResults(
    @Arg("id") id: string,
    @Arg("homeScore") homeScore: number,
    @Arg("awayScore") awayScore: number,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>,
    @Ctx() { req, em }: MyContext
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: req.session.userId });
    const challenge = await em.findOne(Challenge, {
      id: id,
      $or: [
        { homePlayer: req.session.userId },
        { awayPlayer: req.session.userId },
      ],
    });
    if (!challenge || challenge.status != ChallengeStatus.ACTIVE)
      return {
        errors: [
          {
            field: "Not Authorized",
            message:
              "challenge does not exists or you do not have access to this challenge",
          },
        ],
      };

    //check if it been 10 minutes since started
    const date = new Date();
    date.setMinutes(date.getMinutes() - 10);
    if (challenge.updatedAt > date) {
      return {
        errors: [
          {
            field: "Not Authorized",
            message:
              "You cannot upload your score until 10 minutes after the challenge has started",
          },
        ],
      };
    }

    //upload scores
    const uploadedResults = await em.findOne(Scores, {
      challenge: challenge,
    });
    if (uploadedResults)
      return {
        errors: [
          {
            field: "Results Already Uploaded",
            message: "You or your opponent have already uploaded the results you can just agree or disagree on it",
          },
        ],
      };


    const score: Scores = em.create(Scores, {
      challenge: challenge,
      user: user,
      homeScore: homeScore,
      awayScore: awayScore,
    } as Scores);

    await em.persistAndFlush(score);

    //send notification to opponent
    const whoToNotify = user == challenge.homePlayer ? challenge.awayPlayer : challenge.homePlayer;

    //Notifications
    const notification: Notification = em.create(Notification, {
      user: whoToNotify,
      title: "Score Uploaded",
      message: "Your opponent has uploaded the results"
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    return { success: true };
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async cancelPendingChallenge(
    @Arg("id") id: string,
    @Ctx() { req, em }: MyContext
  ): Promise<GeneralResponse> {
    const challenge = await em.findOne(Challenge, {
      id: id,
      homePlayer: req.session.userId
    });
    if (!challenge || challenge.status != ChallengeStatus.PENDING)
      return {
        errors: [
          {
            field: "Not Authorized",
            message:
              "challenge does not exists or you do not have access to cancel this challenge",
          },
        ],
      };
    //cancel match
    wrap(challenge).assign({
      status: ChallengeStatus.CANCELLED,
    });
    //refund bet
    const wallet = await em.findOne(Wallet, { user: req.session.userId })
    const balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance + challenge.bet
    })
    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.POSITIVE,
      user: challenge.homePlayer,
      amount: challenge.bet,
      description: challenge.game.name + " Challenge Cancellation",
    } as Transaction);
    await em.persistAndFlush(transaction);
    return { success: true };
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async rejectInvite(
    @Arg("id") id: string,
    @Ctx() { req, em }: MyContext,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const challenge = await em.findOne(Challenge, {
      id: id,
      awayPlayer: req.session.userId
    });
    if (!challenge || challenge.status != ChallengeStatus.PENDING)
      return {
        errors: [
          {
            field: "Not Authorized",
            message:
              "challenge does not exists or you do not have access to reject this challenge",
          },
        ],
      };
    //cancel match
    wrap(challenge).assign({
      status: ChallengeStatus.CANCELLED,
    });
    //refund bet
    const wallet = await em.findOne(Wallet, { user: challenge.homePlayer.id })
    const balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance + challenge.bet
    })

    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.POSITIVE,
      user: challenge.homePlayer,
      amount: challenge.bet,
      description: challenge.game.name + " Challenge Cancellation",
    } as Transaction);
    await em.persistAndFlush(transaction);

    //Notifications
    const notification: Notification = em.create(Notification, {
      user: challenge.homePlayer,
      title: "Invite rejected",
      message: `${challenge.awayPlayer!.username} has rejected your challenge`
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    return { success: true };
  }

  // TODO:This section should change from a query to a subscription
  // rather than making a request to this on client side
  // this is getting the opponent uploaded results and it will ask
  // the player if he agree with it, if not a dispute will be opened

  @Query(() => Scores || null)
  @UseMiddleware(Authentication)
  async results(
    @Ctx() { req, em }: MyContext,
    @Arg("id") id: string,
  ): Promise<Scores> {
    const challenge = await em.findOne(Challenge, {
      id: id,
      status: ChallengeStatus.ACTIVE,
      $or: [
        { homePlayer: req.session.userId },
        { awayPlayer: req.session.userId },
      ],
    });

    const scores = await em.findOne(Scores, {
      challenge: challenge,
      $not: { user: req.session.userId },
    });
    return scores!;
  }



  //TODO: this code works but needs cleaning
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  async respondToResults(
    @Ctx() { req, em }: MyContext,
    @Arg("id") id: string,
    @Arg("accepted") accepted: boolean,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const challenge = await em.findOne(Challenge, { id: id });
    if (!challenge) {
      return {
        errors: [
          {
            field: "Challenge not found",
            message: "not found",
          },
        ],
      };
    }
    const score = await em.findOne(Scores, {
      challenge: challenge,
      $not: { user: req.session.userId },
    });

    const payout = calculateProfit(challenge!.bet);

    if (accepted) {
      //Tie
      if (score!.homeScore == score!.awayScore) {
        wrap(challenge).assign({
          homeScore: score?.homeScore,
          awayScore: score?.awayScore,
          status: ChallengeStatus.FINISHED,
        });
        //refund homeplayer
        const homePlayerWallet = await em.findOne(Wallet, {
          user: challenge!.homePlayer,
        });
        //returning funds
        let homePlayerBalance = homePlayerWallet!.balance;
        wrap(homePlayerWallet).assign({
          balance: homePlayerBalance + challenge.bet,
        });
        //transaction
        const firstTransaction = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.homePlayer,
          amount: challenge.bet,
          description: challenge.game + " tie",
        } as Transaction);
        await em.persistAndFlush(firstTransaction);

        //refund awayPlayer
        const awayPlayerWallet = await em.findOne(Wallet, {
          user: challenge!.awayPlayer,
        });
        //returning funds
        let balance = awayPlayerWallet!.balance;
        wrap(awayPlayerWallet).assign({
          balance: balance + challenge.bet,
        });
        //transaction
        const secondtransaction = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.awayPlayer,
          amount: challenge.bet,
          description: challenge.game.name + " tie",
        } as Transaction);
        await em.persistAndFlush(secondtransaction);
      }
      //payout
      //adding payout to homeplayer wallet
      if (score!.homeScore > score!.awayScore) {
        //Win
        wrap(challenge).assign({
          homeScore: score?.homeScore,
          awayScore: score?.awayScore,
          winner:
            score!.homeScore > score!.awayScore
              ? challenge!.homePlayer
              : challenge!.awayPlayer,
          status: ChallengeStatus.FINISHED,
        });
        const wallet = await em.findOne(Wallet, {
          user: challenge!.homePlayer,
        });
        //adding payout
        let balance = wallet!.balance;
        wrap(wallet).assign({
          balance: balance + payout,
        });
        //transaction
        const transaction = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.homePlayer,
          amount: payout,
          description: challenge.game.name + " Win",
        } as Transaction);
        await em.persistAndFlush(transaction);
        //adding payout to awayplayer wallet
      } else if (score!.homeScore < score!.awayScore) {
        //Win
        wrap(challenge).assign({
          homeScore: score?.homeScore,
          awayScore: score?.awayScore,
          winner:
            score!.homeScore > score!.awayScore
              ? challenge!.homePlayer
              : challenge!.awayPlayer,
          status: ChallengeStatus.FINISHED,
        });
        const wallet = await em.findOne(Wallet, {
          user: challenge!.awayPlayer,
        });
        //adding payout
        let balance = wallet!.balance;
        wrap(wallet).assign({
          balance: balance + payout,
        });
        //transaction
        const transaction = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.awayPlayer,
          amount: payout,
          description: challenge.game.name + " Win",
        } as Transaction);
        await em.persistAndFlush(transaction);
      }
      //Notifications
      const notification1: Notification = em.create(Notification, {
        user: challenge.homePlayer,
        title: "Challenge Completed",
        message: "challenge has been finished"
      } as Notification)
      em.persistAndFlush(notification1)
      // Publish event to the WebSocket server
      await publish(notification1)

      const notification2: Notification = em.create(Notification, {
        user: challenge.awayPlayer,
        title: "Challenge Completed",
        message: "challenge has been finished"
      } as Notification)
      em.persistAndFlush(notification2)
      // Publish event to the WebSocket server
      await publish(notification2)
      
    } else {
      //not accepted so a dispute
      wrap(challenge).assign({
        status: ChallengeStatus.DISPUTED,
      });
      //Notification
      const notification1: Notification = em.create(Notification, {
        user: challenge.homePlayer,
        title: "Challenge Disputed",
        message: "challenge has been disputed"
      } as Notification)
      em.persistAndFlush(notification1)
      // Publish event to the WebSocket server
      await publish(notification1)

      const notification2: Notification = em.create(Notification, {
        user: challenge.awayPlayer,
        title: "Challenge Disputed",
        message: "challenge has been disputed"
      } as Notification)
      em.persistAndFlush(notification2)
      // Publish event to the WebSocket server
      await publish(notification2)
      //send Emails
      await sendEmail(challenge.homePlayer, `Challenge Disputed`, `Your challenge has been disputed, no worries we will help you resolve it you only have to send us prove along side the challenge id <br/> you can find the challenge id in the lobby`, "Go to lobby", `https://${CLIENT}/game/lobby/${challenge.id}`)
      await sendEmail(challenge.awayPlayer!, `Challenge Disputed`, `Your challenge has been disputed, no worries we will help you resolve it you only have to send us prove along side the challenge id <br/> you can find the challenge id in the lobby`, "Go to lobby", `https://${CLIENT}/game/lobby/${challenge.id}`)

    }
    return { success: true };
  }




}
