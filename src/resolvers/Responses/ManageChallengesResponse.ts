import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";
import { ChallengesStats } from "./Stats/ChallengesStats";

@ObjectType()
export class ManageChallengesResponse {
  @Field(() => [Challenge],)
  activeChallenges: Challenge[];
  @Field(() => [Challenge],)
  pendingChallenges: Challenge[];
  @Field(() => [Challenge],)
  disputedChallenges: Challenge[];
  @Field(() => [Challenge],)
  finishedChallenges: Challenge[];
  @Field(() => ChallengesStats)
  challengesStats: ChallengesStats;
}