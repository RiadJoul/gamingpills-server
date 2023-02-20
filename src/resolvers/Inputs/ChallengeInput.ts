import { Platform } from "../../enums/Challenge";
import { InputType, Field } from "type-graphql";

@InputType()
export class ChallengeInput {
  @Field()
  game: number;
  @Field()
  gameMode: number;
  @Field(() => Platform)
  platform: Platform;
  @Field()
  bet: number;
  @Field(() => String,{nullable:true})
  awayPlayerId?: string;
  @Field()
  comment: string;
}