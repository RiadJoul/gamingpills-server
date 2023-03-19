import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Publisher, PubSub, Query, Resolver, Root, Subscription, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { Authentication } from "../middelware/Authentication";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { Authorization } from "../middelware/Authorization";
import { v4 as uuidv4 } from "uuid";
import { QueryOrder } from "@mikro-orm/core";
import { Limiter } from "../utils/MessageThrottleService";
import { Challenge } from "../entities/Challenge";
import { Status } from "../enums/Challenge";




@Resolver()
export class ConversationResolver {

    @Subscription({
        topics: "PUBLIC_MESSAGES",

    })
    newPublicMessage
        (@Root() messagePayload: Message): Message {
        return {
            id: messagePayload.id,
            user: messagePayload.user,
            content: messagePayload.content,
            createdAt: new Date()
        }
    }

    @Subscription({
        topics: "PRIVATE_MESSAGES",
        filter: ({ payload, context }) => {
            // Only broadcast the message if the user is a member of the conversation
            return payload.conversation.members.toArray().some((member: User) => member.id.includes(context));
        },
    })
    newPrivateMessage
        (@Root() messagePayload: Message): Message {
        return {
            id: messagePayload.id,
            user: messagePayload.user,
            content: messagePayload.content,
            createdAt: new Date()
        }
    }

    


    @Mutation(() => GeneralResponse)
    @UseMiddleware(Authentication)
    @UseMiddleware(Authorization)
    async sendMessage(
        @Arg('id', { nullable: true }) id: string,
        @Arg('content') content: string,
        @PubSub("PUBLIC_MESSAGES") publicMessagepublish: Publisher<Message>,
        @PubSub("PRIVATE_MESSAGES") privateMessagepublish: Publisher<Message>,
        @Ctx() { em, req }: MyContext): Promise<GeneralResponse> {
        const user = await em.findOne(User, { id: req.session.userId })
   
        //limiter for spam protection
        try {
            await Limiter.consume(req.session.userId);
        } catch (error) {
            return {
                errors: [{ field: "content", message: "You are sending messages too quickly. Please avoid spamming." }],
            };
        }

        do {
            var uuid = uuidv4();
            var idExists = await em.findOne(Message, { id: uuid });
        } while (idExists);

        //check if the message is for public or a private challenges
        if (id) {
            const conversation = await em.findOne(Conversation, { id: id });
            const challenge = await em.findOne(Challenge,{id:id,status:Status.ACTIVE});

            if (!conversation) {
                return {
                    errors: [{ field: "Conversation was not found", message: "the challenge you are trying to send a message to does not exist" }],
                };
            }

            if(!challenge) {
                return {
                    errors: [{ field: "Challenge is not Active", message: "the challenge you are trying to send a message is finished or disputed" }],
                };
            }

            //send message to that challenge conversation
            const message: Message = em.create(Message, {
                id: uuid,
                conversation: conversation,
                user: user!,
                content: content
            } as Message)
            em.persistAndFlush(message)
            // Publish a newMessage event to the WebSocket server
            await privateMessagepublish(message)


        } else {
            //send message to public conversation
            const message: Message = em.create(Message, {
                id: uuid,
                user: em.getReference(User, req.session.userId),
                content: content
            } as any)
            em.persistAndFlush(message)

            // Publish a newMessage event to the WebSocket server
            await publicMessagepublish(message)
        }



        return { success: true };
    }


    @Query(() => [Message])
    @UseMiddleware(Authentication)
    async publicMessages(@Ctx() { em }: MyContext): Promise<Message[]> {
        const messages = await em.find(Message, 
        { conversation: null }, 
        { orderBy: [{ createdAt: QueryOrder.ASC }] ,
            limit: 30
        })

        return messages;
    }

    @Query(() => [Message])
    @UseMiddleware(Authentication)

    async privateMessages(
        @Ctx() { em }: MyContext,
        @Arg('id') id: string
        ): Promise<Message[]> {
        const messages = await em.find(Message, { conversation: { id:id} }, { orderBy: [{ createdAt: QueryOrder.ASC }] ,
            limit: 50
        })
        return messages;
    }

    @Query(() => Conversation)
    @UseMiddleware(Authentication)
    async publicConversations(@Ctx() { em }: MyContext): Promise<Conversation> {
        const conversation = await em.findOne(Conversation, { public: true })
        return conversation!;
    }
}
