import { apiRequest } from "@/lib/api";

const CONV_KEY = "arkan-assistant-conversation";
const GUEST_KEY = "arkan-assistant-guest";

export type AssistantProductCard = {
  id: number;
  name: string;
  slug: string;
  price: string;
  effective_price: string;
  image?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  available_stock: number;
  href: string;
  short_specs?: string;
};

export type AssistantBuildPlan = {
  budget: number;
  usage: string;
  total: string;
  remaining?: string;
  compatibility?: string;
  components: Array<{
    slot_id: number;
    slot_name: string;
    product_id: number;
    name: string;
    effective_price: string;
    image?: string | null;
    reason?: string;
  }>;
};

export type AssistantAction = {
  type: string;
  label: string;
  product_id?: number;
  href?: string;
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  products?: AssistantProductCard[];
  build_plan?: AssistantBuildPlan | null;
  actions?: AssistantAction[];
};

export type AssistantPublicConfig = {
  enabled: boolean;
  welcome_message: string;
  quick_replies: string[];
  max_message_length?: number;
  message_cooldown_seconds?: number;
};

export type AssistantLimits = {
  messages_remaining: number;
  daily_remaining: number;
  max_messages_per_conversation: number;
  max_messages_per_day: number;
};

export function readAssistantConversationId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONV_KEY);
}

export function readAssistantGuestToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_KEY);
}

function rememberIds(conversationId?: string | null, guestToken?: string | null) {
  if (conversationId) localStorage.setItem(CONV_KEY, conversationId);
  if (guestToken) localStorage.setItem(GUEST_KEY, guestToken);
}

export function clearAssistantSession() {
  localStorage.removeItem(CONV_KEY);
  localStorage.removeItem(GUEST_KEY);
}

export async function fetchAssistantConfig() {
  return apiRequest<AssistantPublicConfig>("/assistant/config");
}

export async function sendAssistantMessage(message: string) {
  const data = await apiRequest<{
    conversation_id: string;
    guest_token?: string | null;
    limits?: AssistantLimits;
    message: {
      id: string;
      role: "assistant";
      text: string;
      created_at: string;
      products?: AssistantProductCard[];
      build_plan?: AssistantBuildPlan | null;
      actions?: AssistantAction[];
    };
  }>("/assistant/chat", {
    method: "POST",
    body: {
      message,
      conversation_id: readAssistantConversationId(),
      guest_token: readAssistantGuestToken(),
    },
  });
  rememberIds(data.conversation_id, data.guest_token);
  return data;
}

export async function trackAssistantEvent(
  eventType: "product_click" | "build_open" | "quick_reply" | "chat_open" | "new_chat",
  meta?: Record<string, unknown>,
) {
  try {
    await apiRequest("/assistant/events", {
      method: "POST",
      body: {
        conversation_id: readAssistantConversationId(),
        event_type: eventType,
        meta,
      },
    });
  } catch {
    // non-blocking
  }
}

export async function applyAssistantBuild(components: AssistantBuildPlan["components"]) {
  return apiRequest<{
    build_id: number;
    guest_token: string;
    href: string;
  }>("/assistant/apply-build", {
    method: "POST",
    body: {
      conversation_id: readAssistantConversationId(),
      guest_token: readAssistantGuestToken(),
      components: components.map((c) => ({
        slot_id: c.slot_id,
        product_id: c.product_id,
        quantity: 1,
      })),
    },
  });
}

export type AssistantAdminConfig = AssistantPublicConfig & {
  persona: string;
  sales_instructions: string;
  allow_upsell: boolean;
  allow_cross_sell: boolean;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  max_messages_per_conversation: number;
  max_messages_per_day: number;
  max_conversations_per_day: number;
  max_message_length: number;
  message_cooldown_seconds: number;
};

export function fetchAssistantAdminConfig(token: string) {
  return apiRequest<AssistantAdminConfig>("/assistant/admin/config", { token });
}

export function saveAssistantAdminConfig(token: string, body: Partial<AssistantAdminConfig>) {
  return apiRequest<AssistantAdminConfig>("/assistant/admin/config", {
    method: "PUT",
    token,
    body,
  });
}

export function fetchAssistantStats(token: string) {
  return apiRequest<{
    conversations: number;
    messages: number;
    events: number;
    by_event: Array<{ event_type: string; count: number }>;
  }>("/assistant/admin/stats", { token });
}

export function fetchAssistantConversations(token: string) {
  return apiRequest<
    Array<{
      id: string;
      last_message: string | null;
      messages_count: number;
      updated_at: string;
    }>
  >("/assistant/admin/conversations", { token });
}
