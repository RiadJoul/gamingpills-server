import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";
import { FieldError } from "./General/FieldError";

@ObjectType()
export class  SignUpResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User)
    user?: User;
}