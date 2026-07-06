import { readLuckyConversation } from './luckyPushStore';

const STATIC_MESSAGE_UNREAD_COUNT = 7;

export function getConversationsUnreadCount(conversations = []) {
  return conversations.reduce((sum, item) => sum + (Number(item.unread) || 0), 0);
}

export function getInitialMessagesUnreadCount() {
  return STATIC_MESSAGE_UNREAD_COUNT + (Number(readLuckyConversation()?.unread) || 0);
}
