import { useEffect, useState } from "react";
import { getPusherClient } from "@/libs/pusher.client";
import axios from "axios";
import { useSession } from "next-auth/react";
import useConversation from "./useConversation";
import type { FullConversationType } from "@/src/types";
import {
  getUnreadConversationCount,
  subscribeToUnreadConversationEvents,
} from "./unreadConversationCount";

const useUnreadConversationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const session = useSession();
  const pusherKey = session.data?.user?.email;
  const { conversationId } = useConversation();

  useEffect(() => {
    if (!pusherKey) {
      setUnreadCount(0);
      return;
    }

    let isActive = true;
    let latestRequestId = 0;

    const fetchConversations = async () => {
      const requestId = ++latestRequestId;

      try {
        const { data: conversations } =
          await axios.get<FullConversationType[]>("/api/conversations");

        if (!isActive || requestId !== latestRequestId) {
          return;
        }

        setUnreadCount(getUnreadConversationCount(conversations, pusherKey));
      } catch (error) {
        if (isActive && requestId === latestRequestId) {
          console.error("Failed to refresh unread conversations", error);
        }
      }
    };

    const pusherClient = getPusherClient();
    const handleConversationEvent = () => {
      void fetchConversations();
    };
    const unsubscribeFromEvents = subscribeToUnreadConversationEvents(
      pusherClient,
      pusherKey,
      handleConversationEvent
    );

    void fetchConversations();

    return () => {
      isActive = false;
      latestRequestId += 1;
      unsubscribeFromEvents();
    };
  }, [pusherKey, conversationId]);

  return unreadCount;
};

export default useUnreadConversationCount;
