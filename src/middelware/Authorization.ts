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
          field: "You account is banned",
          message: "Contact support for more information",
        },
      ],
    };
  }

  return next();
};
