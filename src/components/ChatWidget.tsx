"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, formatMoney, mediaUrl } from "@/lib/api";
import {
  applyAssistantBuild,
  clearAssistantSession,
  fetchAssistantConfig,
  sendAssistantMessage,
  trackAssistantEvent,
  type AssistantBuildPlan,
  type AssistantMessage,
  type AssistantProductCard,
  type AssistantPublicConfig,
} from "@/lib/assistant";
import { writeGuestToken } from "@/lib/commerce";

function ProductChip({
  product,
  onOpen,
}: {
  product: AssistantProductCard;
  onOpen: () => void;
}) {
  const image = mediaUrl(product.image) || "/logo-white@2x.webp";
  return (
    <div className="chat-product rounded-xl border border-line bg-bg p-2.5">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-contain p-1.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold text-ink">{product.name}</p>
          {product.short_specs && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">{product.short_specs}</p>
          )}
          <p className="mt-1 text-sm font-bold text-accent">
            {formatMoney(product.effective_price)}
          </p>
          <p className="text-[11px] text-ink-muted">
            {product.available_stock > 0 ? "متوفر" : "غير متوفر"}
          </p>
        </div>
      </div>
      <Link
        href={product.href}
        onClick={onOpen}
        className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
      >
        عرض المنتج
      </Link>
    </div>
  );
}

function BuildSummary({
  plan,
  busy,
  onOpen,
}: {
  plan: AssistantBuildPlan;
  busy: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-brand/30 bg-brand/5 p-3">
      <p className="text-xs font-bold text-ink">ملخص التجميعة المقترحة</p>
      <ul className="space-y-1.5">
        {plan.components.map((c) => (
          <li key={`${c.slot_id}-${c.product_id}`} className="flex items-start justify-between gap-2 text-xs">
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{c.slot_name}</span>
              <span className="block text-ink-muted">{c.name}</span>
            </span>
            <span className="shrink-0 font-bold text-accent">{formatMoney(c.effective_price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
        <span className="text-ink-muted">الإجمالي</span>
        <span className="font-bold text-accent">{formatMoney(plan.total)}</span>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onOpen}
        className="w-full rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        اعرض التجميعة وخصص مكوناتها
      </button>
    </div>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [config, setConfig] = useState<AssistantPublicConfig | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);
  const maxLen = config?.max_message_length || 1000;

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void (async () => {
      try {
        const cfg = await fetchAssistantConfig();
        setConfig(cfg);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            text: cfg.welcome_message,
            createdAt: Date.now(),
          },
        ]);
      } catch {
        setConfig({
          enabled: false,
          welcome_message: "المساعد غير متاح حالياً.",
          quick_replies: [],
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  async function sendMessage(text: string) {
    const value = text.trim();
    if (!value || typing || config?.enabled === false) return;
    if (Date.now() < cooldownUntil) {
      setError("استنى لحظة قبل إرسال رسالة جديدة");
      return;
    }
    if (value.length > maxLen) {
      setError(`الرسالة طويلة جداً (الحد ${maxLen} حرف)`);
      return;
    }

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: value,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setError("");

    try {
      const data = await sendAssistantMessage(value);
      const coolSec = config?.message_cooldown_seconds ?? 2;
      if (coolSec > 0) setCooldownUntil(Date.now() + coolSec * 1000);
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: "assistant",
          text: data.message.text,
          createdAt: Date.now(),
          products: data.message.products,
          build_plan: data.message.build_plan,
          actions: data.message.actions,
        },
      ]);
      if (data.limits && data.limits.messages_remaining <= 3) {
        setError(
          data.limits.messages_remaining <= 0
            ? "وصلت لحد رسائل هذه المحادثة. ابدأ محادثة جديدة."
            : `متبقي ${data.limits.messages_remaining} رسائل في هذه المحادثة`,
        );
      }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "تعذر الرد حالياً";
      setError(message);
      if (status === 429) {
        setCooldownUntil(Date.now() + 15_000);
      }
      if (status === 403) {
        clearAssistantSession();
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text:
            status === 429
              ? message || "تم تجاوز حد الاستخدام. حاول بعد شوية أو ابدأ محادثة جديدة."
              : status === 400
                ? message
                : "حصل خطأ مؤقت. حاول تاني بعد شوية.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  async function openBuild(plan: AssistantBuildPlan) {
    setBusyAction(true);
    setError("");
    try {
      const applied = await applyAssistantBuild(plan.components);
      writeGuestToken(applied.guest_token);
      localStorage.setItem("arkan-pc-build-id", String(applied.build_id));
      await trackAssistantEvent("build_open", { build_id: applied.build_id });
      setOpen(false);
      router.push(`/build?build_id=${applied.build_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر فتح التجميعة");
    } finally {
      setBusyAction(false);
    }
  }

  function startNewChat() {
    clearAssistantSession();
    void trackAssistantEvent("new_chat");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: config?.welcome_message || "أهلاً بيك!",
        createdAt: Date.now(),
      },
    ]);
    setError("");
  }

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/checkout")) {
    return null;
  }

  if (config && config.enabled === false) {
    return null;
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="شات مساعد أركان">
          <header className="chat-panel__header">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3a7 7 0 0 0-7 7v1.2A3.8 3.8 0 0 0 4 14.8V16a2 2 0 0 0 2 2h1.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 3a7 7 0 0 1 7 7v1.2A3.8 3.8 0 0 1 20 14.8V16a2 2 0 0 1-2 2h-1.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="12" r="1" fill="currentColor" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-white">مساعد أركان AI</p>
                <p className="text-xs text-white/70">مبيعات + اختيار تجميعة</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="محادثة جديدة"
                className="rounded-md px-2 py-1.5 text-xs text-white/85 hover:bg-white/10"
                onClick={startNewChat}
              >
                جديد
              </button>
              <button
                type="button"
                aria-label="إغلاق الشات"
                className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={listRef} className="chat-panel__messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.role === "user" ? "chat-bubble--user" : "chat-bubble--ai"}`}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.products.map((p) => (
                      <ProductChip
                        key={`${msg.id}-${p.id}`}
                        product={p}
                        onOpen={() =>
                          void trackAssistantEvent("product_click", { product_id: p.id })
                        }
                      />
                    ))}
                  </div>
                )}
                {msg.build_plan?.components?.length ? (
                  <BuildSummary
                    plan={msg.build_plan}
                    busy={busyAction}
                    onOpen={() => void openBuild(msg.build_plan!)}
                  />
                ) : null}
              </div>
            ))}

            {typing && (
              <div className="chat-bubble chat-bubble--ai">
                <div className="chat-typing" aria-label="يكتب الآن">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            {error && <p className="px-1 text-xs text-danger">{error}</p>}
          </div>

          <div className="chat-panel__quick">
            {(config?.quick_replies || []).map((q) => (
              <button
                key={q}
                type="button"
                className="chat-quick-btn"
                onClick={() => {
                  void trackAssistantEvent("quick_reply", { text: q });
                  void sendMessage(q);
                }}
                disabled={typing || Date.now() < cooldownUntil}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="chat-panel__form"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
              placeholder="اكتب طلبك... مثال: تجميعة جيمنج بـ 30000"
              className="chat-panel__input"
              maxLength={maxLen}
              disabled={typing}
            />
            <button
              type="submit"
              className="chat-panel__send"
              aria-label="إرسال"
              disabled={typing || !input.trim() || Date.now() < cooldownUntil}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 12l15-8-5 16-3-6-7-2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chat-fab ${open ? "chat-fab--open" : ""}`}
        aria-label={open ? "إغلاق الشات" : "فتح شات المساعد"}
        aria-expanded={open}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void trackAssistantEvent("chat_open");
        }}
      >
        {open ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
