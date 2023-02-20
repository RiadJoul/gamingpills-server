import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";

@ObjectType()
export class ManageChallengesResponse {
  @Field(() => [Challenge],)
  activeChallenges: Challenge[];
  @Field(() => [Challenge],)
  disputedChallenges: Challenge[];
  @Field(() => [Challenge],)
  finishedChallenges: Challenge[];
}