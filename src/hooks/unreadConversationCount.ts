import type { FullConversationType } from "@/src/types";

const UNREAD_CONVERSATION_EVENTS = [
  "conversation:update",
  "conversation:remove",
] as const;

interface ConversationEventChannel {
  bind: (eventName: string, handler: () => void) => unknown;
  unbind: (eventName: string, handler: () => void) => unknown;
}

interface ConversationEventClient {
  subscribe: (channelName: string) => ConversationEventChannel;
}

export function getUnreadConversationCount(
  conversations: FullConversationType[],
  currentUserEmail: string
): number {
  return conversations.reduce((count, conversation) => {
    const lastMessage = conversation.messages.at(-1);

    if (
      !lastMessage ||
      lastMessage.seen.some((user) => user.email === currentUserEmail)
    ) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function subscribeToUnreadConversationEvents(
  client: ConversationEventClient,
  channelName: string,
  handler: () => void
): () => void {
  const channel = client.subscribe(channelName);

  UNREAD_CONVERSATION_EVENTS.forEach((eventName) => {
    channel.bind(eventName, handler);
  });

  return () => {
    // The header badge and conversation list share this user channel, so this
    // consumer removes only its own handlers instead of closing the channel.
    UNREAD_CONVERSATION_EVENTS.forEach((eventName) => {
      channel.unbind(eventName, handler);
    });
  };
}
