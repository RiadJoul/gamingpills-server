import { ObjectType, Field } from 'type-graphql';
import { User } from './User';
import { Conversation } from './Conversation';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';

@ObjectType()
@Entity()
export class Message {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation,{nullable:true})
  conversation?: Conversation;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}