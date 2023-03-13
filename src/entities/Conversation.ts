import { Entity, PrimaryKey } from '@mikro-orm/core';
import { ObjectType, Field } from 'type-graphql';
import { User } from './User';

@ObjectType()
@Entity()
export class Conversation {
  @Field(() => String)
  @PrimaryKey({ type: "text", unique: true, autoincrement: false, nullable:true })
  id?: string;

  @Field(() => [User])
  members: User[];

  @Field()
  public?: boolean;
}