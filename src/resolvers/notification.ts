import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Query, Resolver, Root, Subscription } from "type-graphql";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { Notification } from "../entities/Notification";
import { QueryOrder } from "@mikro-orm/core";

@Resolver()
export class NotificationResolver {
    @Subscription({
        topics: "NOTIFICATIONS",
        filter: ({ payload, context }) => payload.user.id.includes(context),
      })
      newNotification
        (@Root() notificationPayload: Notification): Notification {
        return { id: notificationPayload.id, title: notificationPayload.title, message: notificationPayload.message, isRead: notificationPayload.isRead, createdAt: notificationPayload.createdAt }
      }
    
    
      @Mutation(() => GeneralResponse)
      async markNotificationsAsRead(
        @Ctx() { em }: MyContext,
      ): Promise<GeneralResponse> {
        const notificationsToUpdate = await em.find(Notification, { isRead: false });
    
        await em.transactional(async (em) => {
          for (const notification of notificationsToUpdate) {
            notification.isRead = true;
            await em.persistAndFlush(notification);
          }
        });
    
        return { success: true };
      }

      @Mutation(() => GeneralResponse)
      async markNotificationAsRead(
        @Arg("id") id:string,
        @Ctx() { em }: MyContext,
      ): Promise<GeneralResponse> {
        const notificationToUpdate = await em.findOne(Notification, { id , isRead:false});
    
        if(notificationToUpdate)
            await em.transactional(async (em) => {
                notificationToUpdate.isRead = true;
                await em.persistAndFlush(notificationToUpdate);
            });
    
        return { success: true };
      }

      @Query(() => [Notification])
        async notifications(
        @Ctx() { em, req }: MyContext,
        ): Promise<Notification[]> {
        const notifications = await em.find(Notification, {
            user: { id: req.session.userId },
        }, {
            orderBy: [{ createdAt: QueryOrder.DESC }],
            limit: 5,
        });

        return notifications;
        }
    
}