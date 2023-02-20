import { registerEnumType } from "type-graphql";

export enum Role {
  ADMIN = "Admin",
  PLAYER = "Player",
}

registerEnumType(Role, {
  name: "Role",
  description: "Role of the user",
});
