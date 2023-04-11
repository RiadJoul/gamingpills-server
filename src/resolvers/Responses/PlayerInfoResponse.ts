import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";
import { Transaction } from "../../entities/Transaction";

@ObjectType()
export class  PlayerInfoResponse {
    @Field(() => User)
    player: User;

    @Field(() => [Challenge])
    challenges: Challenge[];

    @Field(() => [Transaction])
    transactions: Transaction[];

    @Field(() => Number)
    matches: Number;

    @Field(() => Number)
    wins: Number;

    @Field(() => Number)
    losses: Number
}