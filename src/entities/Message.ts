import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";


@ObjectType()
@Entity()
export class Message {
    @Field()
    @PrimaryKey()
    id: number;

    @ManyToOne(() => User)
    user: User;

    @Field(() => String)
    @Property({ type: "text"})
    text: string;
}