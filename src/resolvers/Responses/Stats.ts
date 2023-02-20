import { ObjectType, Field } from "type-graphql";
import { FieldError } from "./General/FieldError";
import { BetsStats } from "./Stats/BetsStats";
import { ChallengesStats } from "./Stats/ChallengesStats";
import { ProfitsStats } from "./Stats/ProfitsStats";
import { WalletsStats } from "./Stats/WalletsStats";

@ObjectType()
export class Stats {
  @Field(() => BetsStats, { nullable: true })
  betsStats?: BetsStats;

  @Field(() => ChallengesStats, { nullable: true })
  challengesStats?: ChallengesStats;
  
  @Field(() => ProfitsStats, { nullable: true })
  profitsStats?: ProfitsStats;

  @Field(() => WalletsStats, { nullable: true })
  walletsStats?: WalletsStats;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}