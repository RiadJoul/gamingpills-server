import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { Arg, Ctx, Mutation, Publisher, PubSub, Query, Resolver, Root, Subscription, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { Authentication } from "../middelware/Authentication";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { Challenge } from "../entities/Challenge";
import { Authorization } from "../middelware/Authorization";





@Resolver()
export class ConversationResolver {

    @Subscription({
        topics: "MESSAGES",
        // filter: ({ payload, context }) => {
        //     // Only broadcast the message if the user is a member of the conversation
        //     return payload.message.conversation.members.some((member: User) => member.id === context.userId);
        // },
    })
    newMessage
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
        @PubSub("MESSAGES") publish: Publisher<Message>,
        @Ctx() { em, req }: MyContext): Promise<GeneralResponse> {
        const user = await em.findOne(User, { id: req.session.userId })
        //TODO: message verification ( check for abusive language etc...)

        //check if the message is for public or a private challenges
        if (id) {
            const conversation = await em.findOne(Conversation, { id: id });

            if (!conversation) {
                return {
                    errors: [{ field: "Conversation was not found", message: "the challenge you are trying to send a message to does not exist" }],
                };
            }

            //send message to that challenge conversation
            const message: Message = em.create(Message, {
                conversation: conversation,
                user: user!,
                content: content
            } as any)
            em.persistAndFlush(message)
            // Publish a newMessage event to the WebSocket server
            await publish({
                user: user!,
                content: content,
                createdAt: message.createdAt
            })

  
        }

        //send message to public conversation
        const message: Message = em.create(Message, {
            user: em.getReference(User, req.session.userId),
            content: content,
            public: true
        } as any)
        em.persistAndFlush(message)

        // Publish a newMessage event to the WebSocket server
        await publish({
            user: user!,
            content: content,
            createdAt: message.createdAt
        })
    
        return { success: true };
    }

    @Query(() => Conversation)
    @UseMiddleware(Authentication)
    async publicConversations(@Ctx() { em }: MyContext): Promise<Conversation> {
        const conversation = await em.findOne(Conversation, { public: true })
        return conversation!;
    }
}
