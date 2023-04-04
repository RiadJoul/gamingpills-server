import { ObjectType, Field } from "type-graphql";
import { Challenge } from "../../entities/Challenge";

@ObjectType()
export class PaginatedChallenges {
  @Field(() => [Challenge])
  challenges: Challenge[];

  @Field()
  hasMore: boolean;
}