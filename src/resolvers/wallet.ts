import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import { Wallet } from "../entities/Wallet";
import { Authentication } from "../middelware/Authentication";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { Transaction } from "../entities/Transaction";
import { Type, Status } from "../enums/Transaction";
import { Authorization } from "../middelware/Authorization";
import { sendEmail } from "../utils/EmailSender";
import { CLIENT } from "../constants";



@Resolver()
export class WalletResolver {
  //GET user wallet
  //TODO: Remove this because we can get the balance
  // from the auhtenticated user query so this is useless
  @UseMiddleware(Authentication)
  @Query(() => Wallet, { nullable: true })
  async wallet(@Ctx() { req, em }: MyContext) {
    const user = await em.findOne(User, { id: req.session.userId });
    const wallet = await em.findOne(Wallet, { user: user });
    return wallet;
  }

  
  @UseMiddleware(Authentication)
  @Mutation(() => GeneralResponse)
  async addFunds(
    @Ctx() { req, em }: MyContext,
    @Arg("amount") amount: number,
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: req.session.userId });
    const wallet = await em.findOne(Wallet, { user: user });
    let balance = wallet!.balance;
    wrap(wallet).assign({
      balance: balance + amount,
    });
    const transaction = em.create(Transaction, {
      status: Status.COMPLETED,
      type: Type.POSITIVE,
      user: user,
      amount: amount,
      description: "PAYPAL",
    } as any);
    await em.persistAndFlush(transaction);
    // //Notification
    // await publish({userId:user!.id,title:"Funds",message:"Your funds has been added to your wallet"})
    sendEmail(user!,"Funds Added",`You have successfully added ${amount} to your gamingpills wallet`,"See Wallet",`${CLIENT}/player/wallet`)
    return { success: true };
  }

  @UseMiddleware(Authentication)
  @Query(() => [Transaction])
  async transactions(@Ctx() { req, em }: MyContext) {
    const user = await em.findOne(User, { id: req.session.userId });
    return await em.find(
      Transaction,
      { user: user },
      { orderBy: [{ createdAt: QueryOrder.DESC }] }
    );
  }


  @UseMiddleware(Authentication)
  @UseMiddleware(Authorization)
  @Mutation(() => GeneralResponse)
  async withdraw(
    @Ctx() { req, em }: MyContext,
    @Arg("amount") amount: number
  ): Promise<GeneralResponse> {
    const user = await em.findOne(User, { id: req.session.userId });
    const wallet = await em.findOne(Wallet, { user: user });
    let balance = wallet!.balance;

    //check if he has a paypal email
    if (!user?.paypal) {
      return {
        errors: [
          {
            field: "Paypal Email",
            message:
              "you do not have a paypal email in your account, Please update it in your account",
          },
        ],
      };
    }

    //check if he has enough balance
    //TODO: withdraw fees (paypal fees)
    if (amount < 10) {
      return {
        errors: [
          {
            field: "Minumum amount",
            message: "the minimum amount you can withdraw is $10",
          },
        ],
      };
    }
    if (balance < amount) {
      return {
        errors: [
          {
            field: "Not enough funds",
            message: "you do not have enough funds in your account",
          },
        ],
      };
    }
    wrap(wallet).assign({
      balance: balance - amount,
    });
    const transaction = em.create(Transaction, {
      status: Status.PENDING,
      type: Type.POSITIVE,
      user: user,
      amount: amount,
      description: "Withdraw",
    } as any);
    await em.persistAndFlush(transaction);
    return { success: true };
  }
}
