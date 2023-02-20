//this response consists of either some errors or a success
import { ObjectType, Field } from "type-graphql";
import { FieldError } from "./FieldError";

@ObjectType()
export class GeneralResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Boolean, { nullable: true })
  success?: Boolean;
}