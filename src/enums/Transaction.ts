import { registerEnumType } from "type-graphql";

export enum Status {
  PENDING = "Pending",
  COMPLETED = "Completed",
  REJECTED = "Rejected",
}

registerEnumType(Status, {
  name: "status",
  description: "Status of the transaction",
});

export enum Type {
  POSITIVE = "Positive",
  NEGATIVE = "Negative",
}

registerEnumType(Type, {
  name: "type",
  description: "Type of the transaction",
});
