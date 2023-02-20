import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class ChallengesStats {
  @Field(() => Number)
  activeChallenges: Number;
  @Field(() => Number)
  pendingChallenges: Number;
  @Field(() => Number)
  disputedChallenges: Number;
  @Field(() => Number)
  finishedChallenges: Number;
}