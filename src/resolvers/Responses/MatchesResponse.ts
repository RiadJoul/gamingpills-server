import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";

@ObjectType()
export class MatchesResponse {
  @Field(() => [Challenge],)
  activeChallenges: Challenge[];
  @Field(() => [Challenge],)
  invites: Challenge[];
  @Field(() => [Challenge],)
  finishedChallenges: Challenge[];
}