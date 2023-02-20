import { User } from "../entities/User";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const EmailVerified: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const user = await context.em.findOne(User, {
    id: context.req.session.userId,
  });
  if (!user!.emailVerified) {
    return {
      errors: [
        {
          field: "Email not verified",
          message: "please verify your email first",
        },
      ],
    };
  }

  return next();
};
