import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class Notification {
    @Field({nullable:true})
    userId?: string
    @Field()
    title: string;
    @Field()
    message: string;
    @Field(() => Date)
    createdAt: Date;
}