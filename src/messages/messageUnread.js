import { readLuckyConversation } from './luckyPushStore';

export const INITIAL_MESSAGE_UNREAD_BY_CONVERSATION = Object.freeze({
  'group-standup': 2,
  'group-agentseek': 5,
});

const STATIC_MESSAGE_UNREAD_COUNT = Object.values(INITIAL_MESSAGE_UNREAD_BY_CONVERSATION)
  .reduce((sum, count) => sum + count, 0);

export function getConversationsUnreadCount(conversations = []) {
  return conversations.reduce((sum, item) => sum + (Number(item.unread) || 0), 0);
}

export function getInitialMessagesUnreadCount() {
  return STATIC_MESSAGE_UNREAD_COUNT + (Number(readLuckyConversation()?.unread) || 0);
}
