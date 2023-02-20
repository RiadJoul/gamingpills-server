import { User } from "../entities/User";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";
import { wrap } from "@mikro-orm/core";

export const Authentication: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const user = await context.em.findOne(User, {
    id: context.req.session.userId,
  });
  console.log("USER",context.req.session)
  if (!context.req.session.userId || !user) {
    throw new Error("Not Authenticated");
  }
  //update last seen
  wrap(user).assign({
    lastSeen: new Date(),
  });

  return next();
};
