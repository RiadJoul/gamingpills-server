import { MyContext } from "../types";
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
import { Authentication } from "../middelware/Authentication";
import { Admin } from "../middelware/Admin";
import { Stats } from "./Responses/Stats";
import { Challenge } from "../entities/Challenge";
import { Status } from "../enums/Challenge";
import { CLIENT, PLATFROM_FEE } from "../constants";
import { ManageChallengesResponse } from "./Responses/ManageChallengesResponse";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { wrap } from "@mikro-orm/core";
import { Wallet } from "../entities/Wallet";
import { Transaction } from "../entities/Transaction";
import { Status as TransactionStatus, Type } from "../enums/Transaction";
import { User } from "../entities/User";
import { calculateProfit } from "../utils/fee";
import { Notification } from "../entities/Notification";
import { sendEmail } from "../utils/EmailSender";
import { Players } from "./Responses/Players";
import { Role } from "../enums/Roles";
import { Wallets } from "./Responses/Wallets";



@Resolver()
export class AdminResolver {

  @Query(() => Stats)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async stats(@Ctx() { em }: MyContext): Promise<Stats> {

    //BETS STATS
    //Active
    const activeBets = await em.createQueryBuilder(Challenge, "c")
      .where({ status: Status.ACTIVE })
      .select('SUM(c.bet)')
      .execute();

    //today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBets = await em.createQueryBuilder(Challenge, 'c')
      .where({ status: Status.FINISHED })
      .select(['SUM(c.bet)'])
      .where('c.created_at >= ?', [today])
      .execute();

    //all time
    const allTimeBets = await em.createQueryBuilder(Challenge, 'c')
      .select(['SUM(c.bet)'])
      .execute();

    //CHALLENGES STATS
    const activeChallenges = await em.count(Challenge, {
      status: Status.ACTIVE
    });
    const pendingChallenges = await em.count(Challenge, {
      status: Status.PENDING
    });
    const disputedChallenges = await em.count(Challenge, {
      status: Status.DISPUTED
    });
    const finishedChallenges = await em.count(Challenge, {
      status: Status.FINISHED
    });

    //PROFITS STATS
    //getting the first day of the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthProfit = await em.createQueryBuilder(Challenge, 'c')
      .where({ status: Status.FINISHED })
      .select(['SUM(c.bet)'])
      .where('c.created_at >= ?', [firstDay])
      .execute();

    //WALLETS STATS
    //total balance of all wallets
    const totalBalance = await em.createQueryBuilder(Wallet, 'w')
      .select(['SUM(w.balance)'])
      .execute();

    //total pending withdraws amount
    const totalPending = await em.createQueryBuilder(Transaction, 't')
      .where({ status: Status.PENDING })
      .select(['SUM(t.amount)'])
      .execute();

    //total deposit
    const totalDeposit = await em.createQueryBuilder(Transaction, 't')
      .where({ status: TransactionStatus.COMPLETED })
      .where({ description: "PAYPAL" })
      .select(['SUM(t.amount)'])
      .execute();

    return {
      betsStats: {
        active: activeBets[0].sum ? activeBets[0].sum * 2 : 0,
        today: todayBets[0].sum ? todayBets[0].sum * 2 : 0,
        allTime: allTimeBets[0].sum ? allTimeBets[0].sum * 2 : 0,
      },
      challengesStats: {
        activeChallenges: activeChallenges,
        pendingChallenges: pendingChallenges,
        disputedChallenges: disputedChallenges,
        finishedChallenges: finishedChallenges
      },
      profitsStats: {
        today: todayBets[0].sum ? (PLATFROM_FEE * (todayBets[0].sum * 2)) / 100 : 0,
        thisMonth: thisMonthProfit[0].sum ? (PLATFROM_FEE * (thisMonthProfit[0].sum * 2)) / 100 : 0,
        allTime: allTimeBets[0].sum ? (PLATFROM_FEE * (allTimeBets[0].sum * 2)) / 100 : 0,
      },
      walletsStats: {
        totalBalance: totalBalance[0].sum ? totalBalance[0].sum : 0,
        pendingAmountWithdraws: totalPending[0].sum ? totalPending[0].sum : 0,
        totalDeposit: totalDeposit[0].sum ? totalDeposit[0].sum : 0
      }
    }
  }

  @Query(() => ManageChallengesResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async challenges(@Ctx() { em }: MyContext): Promise<ManageChallengesResponse> {
    //TODO: pagination with limit
    const activeChallenges = await em.find(Challenge, {
      status: Status.ACTIVE
    })

    const disputedChallenges = await em.find(Challenge, {
      status: Status.DISPUTED
    })

    const finishedChallenges = await em.find(Challenge, {
      status: Status.FINISHED
    })

    return {
      activeChallenges: activeChallenges,
      disputedChallenges: disputedChallenges,
      finishedChallenges: finishedChallenges
    }
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async cancelChallenge(
    @Ctx() { em }: MyContext,
    @Arg('id') id: string,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const challenge = await em.findOne(Challenge, {
      id: id, $and: [
        {
          $or: [
            { status: Status.PENDING },
            { status: Status.ACTIVE },
            { status: Status.DISPUTED },
          ],
        }
      ],
    });
    if (!challenge) {
      return {
        errors: [
          { field: 'Challenge', message: "Challenge not found" }
        ]
      }
    }
    //mark the challenge as cancelled
    wrap(challenge).assign({
      status: Status.CANCELLED
    });

    //return funds to players

    //HOMEPLAYER
    const homePlayerWallet = await em.findOne(Wallet, { user: challenge.homePlayer });
    const amount1ToUpdate = homePlayerWallet!.balance + challenge.bet;

    wrap(homePlayerWallet).assign({
      balance: amount1ToUpdate
    });

    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.POSITIVE,
      user: challenge.homePlayer,
      amount: challenge.bet,
      description: challenge.game.name + " cancelled by an admin",
    } as Transaction);
    await em.persistAndFlush(transaction);

    //AWAYPLAYER
    if (challenge.awayPlayer) {
      const awayPlayerWallet = await em.findOne(Wallet, { user: challenge.awayPlayer });
      const amount2ToUpdate = awayPlayerWallet!.balance + challenge.bet;
      wrap(awayPlayerWallet).assign({
        balance: amount2ToUpdate
      });
      const transaction = em.create(Transaction, {
        status: TransactionStatus.COMPLETED,
        type: Type.POSITIVE,
        user: challenge.awayPlayer,
        amount: challenge.bet,
        description: challenge.game.name + " cancelled by an admin",
      } as Transaction);
      await em.persistAndFlush(transaction);
    }

    //Notifications
    const notification1: Notification = em.create(Notification, {
        user:challenge.homePlayer,
        title: "Challenge",
        message: "challenge has been cancelled by an admin"
    } as Notification)
    em.persistAndFlush(notification1)
    // Publish event to the WebSocket server
    await publish(notification1)

    const notification2: Notification = em.create(Notification, {
        user:challenge.awayPlayer,
        title: "Challenge",
        message: "challenge has been cancelled by an admin"
    } as Notification)
    em.persistAndFlush(notification2)
    // Publish event to the WebSocket server
    await publish(notification2)  
    

    //Email notifications
    sendEmail(challenge.homePlayer, 'Challenge cancelled', "The challenge has been cancelled by an admin", "Go to gamingpills", `https://${CLIENT}/player/feed`)
    return {
      success: true
    }
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async resolveChallenge(
    @Ctx() { em }: MyContext,
    @Arg('id') id: string,
    @Arg('winnerId') winnerId: string,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const challenge = await em.findOne(Challenge, {
      id: id, $and: [
        {
          $or: [
            { status: Status.DISPUTED },
          ],
        }
      ],
    });
    if (!challenge) {
      return {
        errors: [
          { field: 'Challenge', message: "Challenge not found" }
        ]
      }
    }
    //mark the challenge as cancelled
    wrap(challenge).assign({
      status: Status.FINISHED
    });

    //add funds to winner
    const user = await em.findOne(User, { id: winnerId })
    const wallet = await em.findOne(Wallet, { user: user })

    const payout = calculateProfit(challenge!.bet);
    const amountToUpdate = wallet!.balance + payout

    wrap(wallet).assign({
      balance: amountToUpdate
    });

    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.POSITIVE,
      user: user,
      amount: payout,
      description: challenge.game.name + " win",
    } as Transaction);
    await em.persistAndFlush(transaction);

    //Notifications
    const notification1: Notification = em.create(Notification, {
      user:challenge.homePlayer,
      title: "Challenge",
      message: "challenge has been resolved by an admin"
    } as Notification)
    em.persistAndFlush(notification1)
    // Publish event to the WebSocket server
    await publish(notification1)

    const notification2: Notification = em.create(Notification, {
      user:challenge.awayPlayer,
      title: "Challenge",
      message: "challenge has been resolved by an admin"
    } as Notification)
    em.persistAndFlush(notification2)
    // Publish event to the WebSocket server
    await publish(notification2)

    //Email notifications
    sendEmail(challenge.homePlayer, 'Challenge resolved', "The challenge has been resolved by an admin", "Go to gamingpills", `https://${CLIENT}/player/feed`)
    sendEmail(challenge.awayPlayer!, 'Challenge resolved', "The challenge has been resolved by an admin", "Go to gamingpills", `https://${CLIENT}/player/feed`)

    return {
      success: true
    }

  }


  @Query(() => Players)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async players(
    @Ctx() { em }: MyContext,
  ): Promise<Players> {
    const activePlayers = await em.find(User, { role: Role.PLAYER, banned: false }, {
      populate: ['Wallet'],
    });
    const bannedPlayers = await em.find(User, { role: Role.PLAYER, banned: true }, {
      populate: ['Wallet'],
    });

    return {
      activePlayers: activePlayers,
      bannedPlayers: bannedPlayers
    }
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async banPlayer(
    @Ctx() { em }: MyContext,
    @Arg('id') id: string,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: id });

    if (!user) {
      return {
        errors: [
          { field: "User", message: "user not found" }
        ]
      }
    }

    if (user.banned) {
      return {
        errors: [
          { field: "User", message: "user is already banned" }
        ]
      }
    }

    wrap(user).assign({
      banned: true
    });

    const notification: Notification = em.create(Notification, {
      user: user,
      title: "Account banned",
      message: "Your account has been banned"
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    //Email notifications
    sendEmail(user, 'Account has been banned', "Your account has been banned <br/> You can contact Gamingpills support for more information")

    return {
      success: true
    }
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async unbanPlayer(
    @Ctx() { em }: MyContext,
    @Arg('id') id: string,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: id });

    if (!user) {
      return {
        errors: [
          { field: "User", message: "user not found" }
        ]
      }
    }

    if (!user.banned) {
      return {
        errors: [
          { field: "User", message: "user is already not banned" }
        ]
      }
    }

    wrap(user).assign({
      banned: false
    });

    const notification: Notification = em.create(Notification, {
      user: user,
      title: "Account Active",
      message: "Your account has been activated"
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    //Email notifications
    sendEmail(user, 'Account has been activated', "Your account has been activated again <br/> If you have any other question <br/> you can contact Gamingpills support for more information")

    return {
      success: true
    }
  }


  @Query(() => Wallets)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async wallets(@Ctx() { em }: MyContext): Promise<Wallets> {
    const users = await em.find(User, { role: Role.PLAYER });

    const transactions = await em.find(Transaction, {}, {
      orderBy: [
        { createdAt: 1 }
      ]
    })

    const pendingWithdraws = await em.find(Transaction, { status: TransactionStatus.PENDING });

    return {
      users: users,
      transactions: transactions,
      pendingWithdraws: pendingWithdraws
    }

  }


  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  @Mutation(() => GeneralResponse)
  async fundWallet(
    @Ctx() { em }: MyContext,
    @Arg("userId") userId: string,
    @Arg("amount") amount: number,
    @PubSub("NOTIFICATIONS") publish: Publisher<Notification>
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: userId });
    if (!user) { return { errors: [{ field: "User", message: "User not found" }] } }
    const wallet = await em.findOne(Wallet, { user: user });
    let balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance + amount,
    });
    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.POSITIVE,
      user: user,
      amount: amount,
      description: "By Gamingpills",
    } as any);
    await em.persistAndFlush(transaction);

    //Notifications
    const notification: Notification = em.create(Notification, {
      user: user,
      title: "Wallet funded",
      message: "Your wallet has been funded by gamingpills"
    } as Notification)
    em.persistAndFlush(notification)
    // Publish event to the WebSocket server
    await publish(notification)

    //Email notifications
    sendEmail(user, 'Wallet funded', "Your wallet has been funded by gamingpills", "Check wallet", `https://${CLIENT}/player/wallet`)
    return { success: true };
  }

  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  @Mutation(() => GeneralResponse)
  async deductWallet(
    @Ctx() { em }: MyContext,
    @Arg("userId") userId: string,
    @Arg("amount") amount: number
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: userId });
    const wallet = await em.findOne(Wallet, { user: user });
    let balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance + amount,
    });
    const transaction = em.create(Transaction, {
      status: TransactionStatus.COMPLETED,
      type: Type.NEGATIVE,
      user: user,
      amount: amount,
      description: "By Gamingpills",
    } as any);
    await em.persistAndFlush(transaction);
    return { success: true };
  }


  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  @Mutation(() => GeneralResponse)
  async approveWithdraw(
    @Ctx() { em }: MyContext,
    @Arg("transactionId") transactionId: number,
  ): Promise<GeneralResponse> {

    const transaction = await em.findOne(Transaction, { id: transactionId, status: TransactionStatus.PENDING });

    if (!transaction) {
      return {
        errors: [
          { field: "Transaction", message: "Transaction not found" }
        ]
      }
    }

    wrap(transaction).assign({
      status: TransactionStatus.COMPLETED
    });


    //Email notifications
    sendEmail(transaction.user, 'Withdraw completed', "Your requested withdraw has been completed")
    return { success: true };
  }

}
