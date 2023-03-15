import { Entity, ManyToMany, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field } from 'type-graphql';
import { Message } from './Message';
import { User } from './User';

@ObjectType()
@Entity()
export class Conversation {
  //challenge ID
  @Field(() => String)
  @PrimaryKey({ type: "text", unique: true, autoincrement: false, nullable:true })
  id?: string;

  @Field(() => [User])
  @ManyToMany(() => User)
  members: User[];

  @OneToMany(() => Message,(message) => message.conversation)
  messages?: Message[];

  @Field()
  @Property({ type: "boolean" })
  public?: boolean;
}