"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  fetchAssistantAdminConfig,
  fetchAssistantConversations,
  fetchAssistantStats,
  saveAssistantAdminConfig,
  type AssistantAdminConfig,
} from "@/lib/assistant";

type Stats = {
  conversations: number;
  messages: number;
  events: number;
  by_event: Array<{ event_type: string; count: number }>;
};

type ConversationRow = {
  id: string;
  last_message: string | null;
  messages_count: number;
  updated_at: string;
};

const eventLabels: Record<string, string> = {
  product_click: "ضغطات عرض المنتج",
  build_open: "انتقال للتجميعة",
  quick_reply: "ردود سريعة",
  chat_open: "فتح الشات",
  new_chat: "محادثات جديدة",
};

export default function AdminAssistantPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [config, setConfig] = useState<AssistantAdminConfig | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [quickText, setQuickText] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [cfg, st, conv] = await Promise.all([
        fetchAssistantAdminConfig(accessToken),
        fetchAssistantStats(accessToken),
        fetchAssistantConversations(accessToken),
      ]);
      setConfig(cfg);
      setStats(st);
      setConversations(conv);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "تعذر تحميل إعدادات المساعد",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !config) return;
    setSaving(true);
    setError("");
    setOkMsg("");
    try {
      const saved = await saveAssistantAdminConfig(accessToken, config);
      setConfig(saved);
      setOkMsg("تم حفظ إعدادات المساعد");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !config) {
    return <PageLoader label="جاري تحميل مساعد المبيعات" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent">AI Sales Assistant</p>
          <h2 className="font-display text-2xl font-bold text-ink">مساعد المبيعات</h2>
          <p className="mt-1 text-sm text-ink-muted">
            تحكم في التفعيل، الرسالة الترحيبية، أسلوب البيع، ومتابعة استخدام الشات.
          </p>
        </div>
        <button type="button" className="admin-btn" onClick={() => void load()}>
          تحديث
        </button>
      </div>

      {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {okMsg && <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{okMsg}</p>}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="المحادثات" value={stats.conversations} />
          <StatCard label="الرسائل" value={stats.messages} />
          <StatCard label="الأحداث" value={stats.events} />
          <StatCard
            label="فتح التجميعة"
            value={stats.by_event.find((e) => e.event_type === "build_open")?.count || 0}
          />
        </div>
      )}

      {stats && stats.by_event.length > 0 && (
        <div className="rounded-2xl border border-line bg-bg-elevated p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">تفصيل الأحداث</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {stats.by_event.map((row) => (
              <li
                key={row.event_type}
                className="flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2 text-sm"
              >
                <span className="text-ink-muted">{eventLabels[row.event_type] || row.event_type}</span>
                <span className="font-bold text-ink">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-line bg-bg-elevated p-5">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3">
          <span className="text-sm font-semibold text-ink">تشغيل الشات بوت في المتجر</span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
        </label>

        <Field label="رسالة الترحيب">
          <textarea
            className="w-full min-h-24 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
            value={config.welcome_message}
            onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
          />
        </Field>

        <Field label="شخصية المساعد">
          <textarea
            className="w-full min-h-20 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
            value={config.persona}
            onChange={(e) => setConfig({ ...config, persona: e.target.value })}
          />
        </Field>

        <Field label="تعليمات البيع">
          <textarea
            className="w-full min-h-28 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
            value={config.sales_instructions}
            onChange={(e) => setConfig({ ...config, sales_instructions: e.target.value })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 text-sm">
            <span>اقتراح أعلى سعراً (Upsell)</span>
            <input
              type="checkbox"
              checked={config.allow_upsell}
              onChange={(e) => setConfig({ ...config, allow_upsell: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 text-sm">
            <span>منتجات مكملة (Cross-sell)</span>
            <input
              type="checkbox"
              checked={config.allow_cross_sell}
              onChange={(e) => setConfig({ ...config, allow_cross_sell: e.target.checked })}
            />
          </label>
        </div>

        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-ink">حدود الاستخدام والحماية</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <LimitField
              label="رسائل / دقيقة"
              value={config.rate_limit_per_minute}
              onChange={(n) => setConfig({ ...config, rate_limit_per_minute: n })}
            />
            <LimitField
              label="رسائل / ساعة"
              value={config.rate_limit_per_hour}
              onChange={(n) => setConfig({ ...config, rate_limit_per_hour: n })}
            />
            <LimitField
              label="رسائل لكل محادثة"
              value={config.max_messages_per_conversation}
              onChange={(n) => setConfig({ ...config, max_messages_per_conversation: n })}
            />
            <LimitField
              label="رسائل / يوم"
              value={config.max_messages_per_day}
              onChange={(n) => setConfig({ ...config, max_messages_per_day: n })}
            />
            <LimitField
              label="محادثات / يوم"
              value={config.max_conversations_per_day}
              onChange={(n) => setConfig({ ...config, max_conversations_per_day: n })}
            />
            <LimitField
              label="أقصى طول رسالة"
              value={config.max_message_length}
              onChange={(n) => setConfig({ ...config, max_message_length: n })}
            />
            <LimitField
              label="تهدئة بين الرسائل (ث)"
              value={config.message_cooldown_seconds}
              onChange={(n) => setConfig({ ...config, message_cooldown_seconds: n })}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">الأسئلة السريعة</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {config.quick_replies.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full border border-line bg-bg px-3 py-1 text-xs text-ink"
                onClick={() =>
                  setConfig({
                    ...config,
                    quick_replies: config.quick_replies.filter((x) => x !== q),
                  })
                }
                title="إزالة"
              >
                {q} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
              value={quickText}
              placeholder="أضف سؤالاً سريعاً"
              onChange={(e) => setQuickText(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn shrink-0"
              onClick={() => {
                const value = quickText.trim();
                if (!value || config.quick_replies.includes(value) || config.quick_replies.length >= 8) return;
                setConfig({ ...config, quick_replies: [...config.quick_replies, value] });
                setQuickText("");
              }}
            >
              إضافة
            </button>
          </div>
        </div>

        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </form>

      <div className="rounded-2xl border border-line bg-bg-elevated p-5">
        <h3 className="mb-3 text-sm font-bold text-ink">آخر المحادثات</h3>
        {conversations.length === 0 ? (
          <p className="text-sm text-ink-muted">لا توجد محادثات بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {conversations.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-muted">{c.id}</p>
                  <p className="mt-1 line-clamp-2 text-ink">{c.last_message || "—"}</p>
                </div>
                <div className="shrink-0 text-end text-xs text-ink-muted">
                  <p>{c.messages_count} رسالة</p>
                  <p>{new Date(c.updated_at).toLocaleString("ar-SA")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elevated px-4 py-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function LimitField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <input
        type="number"
        className="w-full rounded-xl border border-line bg-bg-elevated px-3 py-2 text-sm text-ink"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}
