import { registerEnumType } from "type-graphql";

export enum Category {
  SPORTS = "Sports",
}

registerEnumType(Category, {
  name: "Category",
  description: "Category of the game",
});
