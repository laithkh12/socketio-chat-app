export type ChatMessage = {
  id: string;
  username: string;
  text: string;
  createdAt: string;
};

export type OutgoingChatMessage = {
  username: string;
  text: string;
};
