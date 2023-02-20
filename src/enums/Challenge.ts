import { registerEnumType } from "type-graphql";

export enum Status {
  PENDING = "Pending",
  ACTIVE = "Active",
  FINISHED = "Finished",
  CANCELLED = "Cancelled",
  DISPUTED = "Disputed"
}
registerEnumType(Status, {
  name: "Status",
  description: "status of a challenge",
});

export enum Platform {
  PS4 = 'Playstation 4',
  PS5 = 'Playstation 5',
  XBOXONE = 'XBOX ONE',
  XBOXSERIES = 'XBOX SERIES X/S',
}
registerEnumType(Platform, {
  name: "Platform",
  description: "Platform of the challenge",
});

export enum Mode {
  OPEN = "Open",
  CHALLENGE = "Challenge"
}
registerEnumType(Mode, {
  name: "Mode",
  description: "Mode (OPEN or CHALLENGE)",
});