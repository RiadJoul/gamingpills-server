import { EntityManager, IDatabaseDriver, Connection, wrap } from "@mikro-orm/core";
import * as schedule from 'node-schedule'
import { Status } from "../enums/Challenge";
import { Challenge } from "../entities/Challenge";
import {Status as ChallengeStatus} from "../enums/Challenge";
import {Status as TransactionStatus,Type} from "../enums/Transaction";
import { Wallet } from "../entities/Wallet";
import { Transaction } from "../entities/Transaction";
import { Scores } from "../entities/Scores";
import { calculateProfit } from "../utils/fee";

//TODO: split schedulers and import them here
  
export const challengeScheduler = (em:EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>) => {

  // scheduled for every 5 seconds
  schedule.scheduleJob('0-59/5 * * * * *',async function(){
    //check for pending challenges that had been 5 minutes ago
    // console.log("CHECKING FOR EXPIRED CHALLENGES")
    checkExpiredChallenges(em);
  });


  // scheduled for every 15 seconds
  schedule.scheduleJob('0-59/15 * * * * *',async function(){
    //check for active challenges that only player uploaded the score
    // console.log("CHECKING FOR PLAYERS WHO DID NOT UPLOAD SCORE")
    checkUploadedScores(em);
  });

  //scheduled for every 5 minutes
  schedule.scheduleJob("*/10 * * * *", function() {
    //check for active challenges that hasnt been played for 2 hours
    // console.log("CHECK FOR INACTIVE ACTIVE CHALLENGES")
    checkInactiveActiveChallenges(em);
});
}


//Schedulers

const checkExpiredChallenges = async (em:EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>) => {
    const date = new Date();
    // set 5 minutes
    date.setMinutes(date.getMinutes() - 5 );
    const expiredChallenges = await em.find(Challenge,{
      $and: [
        {status:Status.PENDING},
        {createdAt: { $lte: new Date(date) }}
      ]
    })
    if(expiredChallenges.length > 0) {
      // console.log(expiredChallenges)
        expiredChallenges.forEach(async (challenge:Challenge) => {
            //cancel match
            wrap(challenge).assign({
              status: ChallengeStatus.CANCELLED,
            });
            //refund bet
            const wallet = await em.findOne(Wallet, { user: challenge.homePlayer.id })
            console.log(wallet)
            const balance = wallet!.balance;
            wrap(wallet).assign({
              balance: balance + challenge.bet
            })
            const transaction = em.create(Transaction, {
              status: TransactionStatus.COMPLETED,
              type: Type.POSITIVE,
              user: challenge.homePlayer,
              amount: challenge.bet,
              description: challenge.game.name + " Challenge Expired",
            } as Transaction);
            await em.persistAndFlush(transaction);

            console.log('CHALLENGE ID: ' + challenge.id + " CANCELLED")
        })
      }
}


const checkUploadedScores = async (em:EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>) => {
    //check for challenges the has been active for 10 mintues
    const date = new Date();
    date.setMinutes(date.getMinutes() - 10 );
    const activeChallenges = await em.find(Challenge,{
      $and: [
        {status:Status.ACTIVE},
        {updatedAt: { $lte: new Date(date) }}
      ]
    })
    //check if a results has been uploaded
    if(activeChallenges.length > 0) {
        activeChallenges.forEach(async (challenge:Challenge) => {
          //check if its been 20 minutes after the initial results has been uploaded
          const score = await em.findOne(Scores,{challenge:challenge});
          if(score) {
            //if it been 20 minutes forfeit the match
            const date = new Date();
            date.setMinutes(date.getMinutes() - 20 );
            if(score.createdAt < date) {
              //mark challenge as finished and assign winner
              wrap(challenge).assign({
                status: ChallengeStatus.FINISHED,
                winner:score.user
              });
              //transaction
              const wallet = await em.findOne(Wallet, { user: score.user })
              const balance = wallet!.balance;
              const payout = calculateProfit(challenge.bet)
              wrap(wallet).assign({
                balance: balance + payout
              })
            const transaction = em.create(Transaction, {
              status: TransactionStatus.COMPLETED,
              type: Type.POSITIVE,
              user: score.user,
              amount: payout,
              description: challenge.game.name + " Win",
            } as Transaction);
            await em.persistAndFlush(transaction);
            }
          }
        })
    }
}

const checkInactiveActiveChallenges = async (em:EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>) => {
    //check for challenges the has been active for 2 hours
    const date = new Date();
    date.setMinutes(date.getMinutes() - 120 );
    const activeChallenges = await em.find(Challenge,{
      $and: [
        {status:Status.ACTIVE},
        {updatedAt: { $lte: new Date(date) }}
      ]
    });
    if(activeChallenges.length > 0) {
      activeChallenges.forEach(async (challenge:Challenge) => {
        //set challenge as cancelled
        wrap(challenge).assign({
          status: ChallengeStatus.CANCELLED
        });
        //refund homeplayer
        //transaction
        const homePlayerWallet = await em.findOne(Wallet, { user: challenge.homePlayer });
        const homePlayerBalance = homePlayerWallet!.balance;
        wrap(homePlayerWallet).assign({
          balance: homePlayerBalance + challenge.bet
        })
        //transaction
        const transaction1 = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.homePlayer,
          amount: challenge.bet,
          description: challenge.game.name + "Challenge Cancelled",
        } as Transaction);
        await em.persistAndFlush(transaction1);
        //refund awayplayer
        const awayPlayerWallet = await em.findOne(Wallet, { user: challenge.awayPlayer });
        const awayPlayerBalance = awayPlayerWallet!.balance;
        wrap(awayPlayerWallet).assign({
          balance: awayPlayerBalance + challenge.bet
        })
        //transaction
        const transaction2 = em.create(Transaction, {
          status: TransactionStatus.COMPLETED,
          type: Type.POSITIVE,
          user: challenge.awayPlayer,
          amount: challenge.bet,
          description: challenge.game.name + "Challenge Cancelled",
        } as Transaction);
        await em.persistAndFlush(transaction2);
      })
  }




}