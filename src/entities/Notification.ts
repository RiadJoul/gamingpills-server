import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Notification {
    @Field(() => String)
    @PrimaryKey({ type: "text", unique: true, autoincrement: false })
    id: string;

    @Field(() => User)
    @ManyToOne(() => User)
    user?: User;

    @Field(() => String)
    @Property({ type: "text"})
    title: string;

    @Field(() => String)
    @Property({ type: "text"})
    message: string;

    @Field(() => Boolean, { nullable: true })
    @Property({type:"Boolean"})
    isRead: boolean = false;

    @Field(() => Date, { nullable: true })
    @Property({ type: "date" })
    createdAt?: Date = new Date();
}