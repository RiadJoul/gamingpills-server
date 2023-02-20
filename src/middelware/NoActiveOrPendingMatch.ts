import { Challenge } from "../entities/Challenge";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";
import { Status } from "../enums/Challenge";


export const NoActiveOrPendingMatch: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const challenge = await context.em.find(Challenge, {
    $and: [
      {
        $or: [
          { homePlayer: context.req.session.userId,status: Status.PENDING },
          { awayPlayer: context.req.session.userId,status: Status.ACTIVE },
          { homePlayer: context.req.session.userId,status: Status.ACTIVE },
        ],
      }
    ],
  });
  if (challenge.length > 0)
    return {
      errors: [
        { field: "You already have a challenge", message: "You already have an active or pending challenge, complete it or cancel it and try again" },
      ],
    };

  return next();
};
