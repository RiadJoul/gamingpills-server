import { ObjectType, Field } from 'type-graphql';
import { User } from './User';
import { Conversation } from './Conversation';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';

@ObjectType()
@Entity()
export class Message {
  @Field(
    {nullable:true}
  )
  @PrimaryKey()
  id: number;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation,{nullable:true})
  conversation?: Conversation;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User;

  @Field()
  @Property({ type: "text"})
  content: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  createdAt: Date = new Date();
}