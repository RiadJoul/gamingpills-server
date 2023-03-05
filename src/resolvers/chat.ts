import { Message } from "../entities/Message";
import { Arg, Mutation, Publisher, PubSub, Query, Resolver, Root, Subscription } from "type-graphql";



@Resolver()
export class ChatResolver {
    @Query(() => [Message])
    async messages() {
      return ();
    }
  
    @Mutation(() => Message)
    async createMessage(
      @Arg('chatId') chatId: number,
      @Arg('senderId') senderId: number,
      @Arg('text') text: string,
      @PubSub('NEW_MESSAGE') publish: Publisher<Message>,
    ) {
      const message = Message.create({
        chatId,
        senderId,
        text,
      });
      await message.save();
      await publish(message);
      return message;
    }
  
    @Subscription(() => Message, {
      topics: 'NEW_MESSAGE',
    })
    newMessage(@Root() message: Message) {
      return message;
    }

  
  
}