import { Entity, Enum, OneToMany, OneToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Role } from "../enums/Roles";
import { Field, ObjectType } from "type-graphql";
import { Challenge } from "./Challenge";
import { Wallet } from "./Wallet";

@ObjectType()
@Entity()
export class User {
  @Field(() => String)
  @PrimaryKey({ type: "text", unique: true, autoincrement: false })
  id: string;

  @Field(() => Role, { nullable: true })
  @Enum(() => Role)
  role: Role;

  @Field(() => Boolean, { nullable: true })
  @Property({ type: "boolean" })
  banned: Boolean = false;

  @Field(() => String)
  @Property({ type: "text", unique: true })
  username: string;

  @Field(() => String, { nullable: true })
  @Property({ type: "text" })
  firstName: string;

  @Field(() => String, { nullable: true })
  @Property({ type: "text" })
  lastName: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  birthDate: Date;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", unique: true })
  email!: string;

  @Field(() => Boolean, { nullable: true })
  @Property({ type: "boolean" })
  emailVerified: Boolean = false;

  @Field(() => String, { nullable: true })
  @Property({ type: "text" })
  password!: string;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", nullable: true })
  psnId: string;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", nullable: true })
  xboxId: string;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", nullable: true })
  avatar: string;

  @OneToMany(
    () => Challenge,
    (challenge) => challenge.homePlayer || challenge.awayPlayer,
    { nullable: true }
  )
  Challenges: Challenge[];

  @Field(() => Wallet,{nullable:true})
  @OneToOne(
    () => Wallet,
    (wallet) => wallet.user,
  )
  Wallet?: Wallet;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", nullable: true })
  paypal: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date", nullable: true })
  lastSeen: Date;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
