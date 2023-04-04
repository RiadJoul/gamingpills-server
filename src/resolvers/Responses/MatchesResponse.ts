import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";
import { PaginatedChallenges } from "./PaginatedChallenges";

@ObjectType()
export class MatchesResponse {
  @Field(() => [Challenge])
  activeChallenges: Challenge[];
  @Field(() => [Challenge])
  invites: Challenge[];
  @Field(() => PaginatedChallenges)
  finishedChallenges: PaginatedChallenges;
}