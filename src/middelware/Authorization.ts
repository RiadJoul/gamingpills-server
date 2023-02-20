import { User } from "../entities/User";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const Authorization: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const user = await context.em.findOne(User, {
    id: context.req.session.userId,
  });
  if (user!.banned) {
    return {
      errors: [
        {
          field: "Not authorized",
          message: "You account is banned",
        },
      ],
    };
  }

  return next();
};
