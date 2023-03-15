import { ObjectType, Field } from 'type-graphql';
import { User } from './User';
import { Conversation } from './Conversation';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';

@ObjectType()
@Entity()
export class Message {
  @Field(() => String)
  @PrimaryKey({ type: "text", unique: true, autoincrement: false })
  id: string;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation)
  conversation?: Conversation;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User;

  @Field()
  @Property({ type: "text"})
  content: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  createdAt?: Date = new Date();
}