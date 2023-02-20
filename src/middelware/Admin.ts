import { User } from "../entities/User";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";
import { Role } from "../enums/Roles";

export const Admin: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const user = await context.em.findOne(User, {
    id: context.req.session.userId,
  });
  if (user!.role != Role.ADMIN) {
    return {
      errors: [
        {
          field: "Not authorized",
          message: "You are not authorized",
        },
      ],
    };
  }

  return next();
};