import { describe, expect, mock, test } from "bun:test";
import {
  getUnreadConversationCount,
  subscribeToUnreadConversationEvents,
} from "./unreadConversationCount";

describe("getUnreadConversationCount", () => {
  test("counts conversations whose last message has not been seen", () => {
    const conversations = [
      {
        messages: [{ seen: [{ email: "other@example.com" }] }],
      },
      {
        messages: [{ seen: [{ email: "current@example.com" }] }],
      },
      {
        messages: [],
      },
    ];

    expect(
      getUnreadConversationCount(conversations, "current@example.com")
    ).toBe(1);
  });
});

describe("subscribeToUnreadConversationEvents", () => {
  test("listens on the user channel for count-changing events", () => {
    const bind = mock(() => undefined);
    const unbind = mock(() => undefined);
    const subscribe = mock(() => ({ bind, unbind }));
    const handler = mock(() => undefined);

    const cleanup = subscribeToUnreadConversationEvents(
      { subscribe },
      "current@example.com",
      handler
    );

    expect(subscribe).toHaveBeenCalledWith("current@example.com");
    expect(bind).toHaveBeenCalledTimes(2);
    expect(bind).toHaveBeenCalledWith("conversation:update", handler);
    expect(bind).toHaveBeenCalledWith("conversation:remove", handler);

    cleanup();

    expect(unbind).toHaveBeenCalledTimes(2);
    expect(unbind).toHaveBeenCalledWith("conversation:update", handler);
    expect(unbind).toHaveBeenCalledWith("conversation:remove", handler);
  });
});
