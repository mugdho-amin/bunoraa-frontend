"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  ShoppingBag,
  Tag,
  AlertTriangle,
  Info,
  MessageSquare,
  CheckCheck,
  Archive,
  Trash2,
  Search,
  ChevronDown,
  X,
  Loader2,
  RefreshCw,
  Settings,
  Inbox,
  SlidersHorizontal,
  CreditCard,
  Check,
  Clock,
  BellOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationFilters } from "@/components/notifications/useNotifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const TABS = ["all", "unread", "transactional", "marketing", "system", "custom", "archived"] as const;
type Tab = (typeof TABS)[number];

type DateRangePreset = "today" | "7d" | "30d" | "custom" | null;

const DATE_PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Custom", value: "custom" },
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  system: Bell,
  order: ShoppingBag,
  promotion: Tag,
  marketing: MessageSquare,
  transactional: CreditCard,
  custom: Info,
  alert: AlertTriangle,
};

const TYPE_BADGE_VARIANT: Record<string, string> = {
  order: "primary",
  promotion: "warning",
  system: "muted",
  marketing: "accent",
  transactional: "success",
  custom: "default",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getIconForNotification(note: NotificationItem): LucideIcon {
  const key = note.type || note.category || "system";
  return TYPE_ICONS[key.toLowerCase()] || Bell;
}

function getBadgeVariant(note: NotificationItem): string {
  const key = note.type || note.category || "system";
  return TYPE_BADGE_VARIANT[key.toLowerCase()] ?? "muted";
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function filterBySearch(note: NotificationItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    (note.title || "").toLowerCase().includes(q) ||
    (note.message || "").toLowerCase().includes(q)
  );
}

function filterByDateRange(
  note: NotificationItem,
  range: DateRangePreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!range || !note.created_at) return true;
  const noteDate = new Date(note.created_at);
  const now = new Date();

  switch (range) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return noteDate >= start;
    }
    case "7d": {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return noteDate >= start;
    }
    case "30d": {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return noteDate >= start;
    }
    case "custom": {
      if (customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        e.setHours(23, 59, 59, 999);
        return noteDate >= s && noteDate <= e;
      }
      return true;
    }
    default:
      return true;
  }
}

function sortNotifications(notes: NotificationItem[], order: "newest" | "oldest"): NotificationItem[] {
  return [...notes].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return order === "newest" ? bTime - aTime : aTime - bTime;
  });
}

function computeStats(notes: NotificationItem[]) {
  const total = notes.length;
  const unread = notes.filter((n) => !n.is_read).length;
  const categories: Record<string, number> = {};
  notes.forEach((n) => {
    const cat = n.category || "system";
    categories[cat] = (categories[cat] || 0) + 1;
  });
  return { total, unread, categories };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} variant="bordered" padding="md" className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function NotificationCard({
  note,
  selected,
  onToggle,
  onMarkRead,
  onArchive,
}: {
  note: NotificationItem;
  selected: boolean;
  onToggle: (id: string) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const badgeVariant = getBadgeVariant(note);
  const categoryLabel = note.category || note.type || "system";
  const isUnread = !note.is_read;
  const IconComponent = getIconForNotification(note);

  return (
    <Card
      variant="interactive"
      padding="md"
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden border-border/70 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg sm:gap-4",
        isUnread && "border-l-4 border-l-primary bg-gradient-to-r from-primary/[0.07] via-card to-card"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
          isUnread
            ? "bg-primary/12 text-primary ring-primary/15"
            : "bg-muted text-muted-foreground ring-border"
        )}
      >
        {React.createElement(IconComponent, { className: "h-5 w-5", strokeWidth: 1.6 })}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "truncate text-sm sm:text-base",
                  isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                )}
              >
                {note.title || "Notification"}
              </h3>
              {isUnread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </div>
            {note.message && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {note.message}
              </p>
            )}
          </div>

          {/* Checkbox */}
          <label className="relative flex shrink-0 items-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(note.id)}
              className="peer sr-only"
              aria-label={`Select notification: ${note.title || "Untitled"}`}
            />
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-150",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border group-hover:border-foreground/40",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1"
              )}
            >
              {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
          </label>
        </div>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariant as "primary" | "warning" | "muted" | "accent" | "success" | "default"} size="sm">
            {categoryLabel}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(note.created_at)}
          </span>
        </div>

        {/* Action row */}
        <div className="mt-3 hidden items-center gap-3 border-t border-border/50 pt-3 opacity-70 transition-opacity duration-150 group-hover:opacity-100 sm:flex">
          {note.url && (
            <Link
              href={note.url}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View details
            </Link>
          )}
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkRead(note.id)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark read
            </button>
          )}
          <button
            type="button"
            onClick={() => onArchive(note.id)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {note.is_archived ? "Restore" : "Archive"}
          </button>
        </div>

        {/* Mobile action buttons (always visible on small screens) */}
        <div className="mt-2 flex items-center gap-2 sm:hidden">
          {note.url && (
            <Link
              href={note.url}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              View
            </Link>
          )}
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkRead(note.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              <Check className="h-3 w-3" />
              Read
            </button>
          )}
          <button
            type="button"
            onClick={() => onArchive(note.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          >
            <Archive className="h-3 w-3" />
            {note.is_archived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function FilterPanel({
  dateRange,
  setDateRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  sortOrder,
  setSortOrder,
  onClose,
}: {
  dateRange: DateRangePreset;
  setDateRange: (v: DateRangePreset) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  sortOrder: "newest" | "oldest";
  setSortOrder: (v: "newest" | "oldest") => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors lg:hidden"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Date Range
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setDateRange(preset.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                dateRange === preset.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {dateRange === "custom" && (
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="date"
              inputSize="sm"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1"
              aria-label="Start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              inputSize="sm"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1"
              aria-label="End date"
            />
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sort by
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setSortOrder("newest")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              sortOrder === "newest"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("oldest")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              sortOrder === "oldest"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            Oldest
          </button>
        </div>
      </div>

      {/* Clear */}
      <button
        type="button"
        onClick={() => {
          setDateRange(null);
          setSortOrder("newest");
          setCustomStart("");
          setCustomEnd("");
        }}
        className="w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function NotificationsPageContent() {
  const [activeTab, setActiveTab] = React.useState<Tab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRangePreset>(null);
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">("newest");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showFilterSheet, setShowFilterSheet] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const queryClient = useQueryClient();

  const hookFilters = React.useMemo<NotificationFilters>(() => {
    const f: NotificationFilters = {};
    if (activeTab === "unread") f.unread = true;
    else if (activeTab === "archived") f.archived = true;
    else if (activeTab !== "all") f.category = activeTab;
    return f;
  }, [activeTab]);

  const { notificationsQuery, unreadCountQuery, markAllRead, markRead } =
    useNotifications(hookFilters, {
      includeList: true,
      includeUnread: true,
    });

  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiFetch("/notifications/archive/", {
        method: "POST",
        body: { notification_ids: ids },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
      setSelectedIds(new Set());
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiFetch("/notifications/restore/", {
        method: "POST",
        body: { notification_ids: ids },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
      setSelectedIds(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiFetch("/notifications/delete/", {
        method: "POST",
        body: { notification_ids: ids },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
      setSelectedIds(new Set());
    },
  });

  // Stable reference for the notification list so useMemo consumers below
  // don't see a fresh `?? []` array on every render.
  const notifications = React.useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = unreadCountQuery.data?.count ?? 0;

  // Client-side filtering & sorting
  const filtered = React.useMemo(() => {
    let result = notifications;

    if (searchQuery) {
      result = result.filter((n) => filterBySearch(n, searchQuery));
    }

    result = result.filter((n) =>
      filterByDateRange(n, dateRange, customStart, customEnd)
    );

    return sortNotifications(result, sortOrder);
  }, [notifications, searchQuery, dateRange, customStart, customEnd, sortOrder]);

  const totalFiltered = filtered.length;
  const visibleNotifications = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < totalFiltered;

  const stats = React.useMemo(() => computeStats(notifications), [notifications]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, dateRange, activeTab, sortOrder, customStart, customEnd]);

  // Selection logic
  const isAllSelected =
    visibleNotifications.length > 0 &&
    visibleNotifications.every((n) => selectedIds.has(n.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleNotifications.map((n) => n.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleMarkSelectedRead = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    markRead.mutate(ids);
  };

  const handleArchiveSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (activeTab === "archived") restoreMutation.mutate(ids);
    else archiveMutation.mutate(ids);
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    deleteMutation.mutate(ids);
  };

  const handleSingleMarkRead = (id: string) => {
    markRead.mutate([id]);
  };

  const handleSingleArchive = (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    if (notification?.is_archived) restoreMutation.mutate([id]);
    else archiveMutation.mutate([id]);
  };

  const handleRetry = () => {
    notificationsQuery.refetch();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <AuthGate
      title="Notifications"
      description="Sign in to view your notifications."
    >
      <div className="mx-auto w-full max-w-7xl px-[var(--page-gutter)] py-8 sm:py-12">
        {/* Stats header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.10] via-card to-accent/[0.08] p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Notifications
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Your updates</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 rounded-xl bg-card border border-border/50 px-4 py-2 text-sm">
                <div className="text-center">
                  <span className="block text-lg font-bold text-foreground">{stats.total}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="text-center">
                  <span className="block text-lg font-bold text-primary">{stats.unread}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Unread
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || stats.unread === 0}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all read
              </Button>
            </div>
          </div>

          {/* Category breakdown */}
          {stats.total > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {Object.entries(stats.categories).map(([cat, count]) => (
                <Badge key={cat} variant={TYPE_BADGE_VARIANT[cat.toLowerCase()] as "primary" | "warning" | "muted" | "accent" | "success" | "default"} size="sm">
                  {cat}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Mobile filter bottom sheet */}
        {showFilterSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowFilterSheet(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-premium animate-slide-in-up">
              <FilterPanel
                dateRange={dateRange}
                setDateRange={setDateRange}
                customStart={customStart}
                setCustomStart={setCustomStart}
                customEnd={customEnd}
                setCustomEnd={setCustomEnd}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                onClose={() => setShowFilterSheet(false)}
              />
            </div>
          </div>
        )}

        <div className="lg:flex lg:gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-border/60 bg-card p-5">
              <FilterPanel
                dateRange={dateRange}
                setDateRange={setDateRange}
                customStart={customStart}
                setCustomStart={setCustomStart}
                customEnd={customEnd}
                setCustomEnd={setCustomEnd}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* Tabs */}
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1 [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                const tabLabel = tab === "all" ? "All" : tab === "unread" ? "Unread" : tab.charAt(0).toUpperCase() + tab.slice(1);
                const tabCount =
                  tab === "all"
                    ? stats.total
                    : tab === "unread"
                      ? stats.unread
                      : tab === "archived" ? notifications.length : stats.categories[tab] ?? 0;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      clearSelection();
                    }}
                    className={cn(
                      "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    )}
                  >
                    {tabLabel}
                    {tabCount > 0 && (
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {tabCount > 99 ? "99+" : tabCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search & action bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  inputSize="sm"
                  className="pl-9 pr-8"
                  aria-label="Search notifications"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {totalFiltered} notification{totalFiltered !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilterSheet(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5">
                <span className="text-sm font-medium text-foreground">
                  {selectedIds.size} selected
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {isAllSelected ? "Deselect all" : "Select all"}
                  </Button>
                  <div className="h-5 w-px bg-border/60" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkSelectedRead}
                    disabled={markRead.isPending}
                  >
                    {markRead.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                    Mark read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleArchiveSelected}
                    disabled={archiveMutation.isPending || restoreMutation.isPending}
                  >
                    {archiveMutation.isPending || restoreMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    {activeTab === "archived" ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleteMutation.isPending}
                    className="text-error-600 hover:text-error-700 hover:bg-error-100/50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Notification list / states */}
            {notificationsQuery.isLoading ? (
              <NotificationSkeleton />
            ) : notificationsQuery.isError ? (
              <Card variant="bordered" padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="mb-4 h-12 w-12 text-warning-500" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground">Failed to load notifications</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-6"
                  onClick={handleRetry}
                  loading={notificationsQuery.isRefetching}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </Card>
            ) : visibleNotifications.length === 0 ? (
              <Card variant="bordered" padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex items-center justify-center">
                  <div className="relative">
                    <Inbox className="h-16 w-16 text-foreground/15" strokeWidth={1.2} />
                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {searchQuery || dateRange
                    ? "No matching notifications"
                    : "No notifications yet"}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {searchQuery || dateRange
                    ? "Try adjusting your search or filters."
                    : "We'll let you know when there are updates on your orders, preorders, or artisan collections."}
                </p>
                {!searchQuery && !dateRange && (
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs text-primary">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Order updates
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs text-accent-700 dark:text-accent-300">
                      <Tag className="h-3.5 w-3.5" />
                      Promotions
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                      <Bell className="h-3.5 w-3.5" />
                      System alerts
                    </div>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {searchQuery || dateRange ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setDateRange(null);
                        setCustomStart("");
                        setCustomEnd("");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                  <Button asChild variant="primary" size="sm">
                    <Link href="/products/">Browse products</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Select all checkbox header */}
                <div className="flex items-center justify-between px-1">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="peer sr-only"
                      aria-label="Select all notifications"
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border-2 transition-all",
                        isAllSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {isAllSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    Select all
                  </label>
                </div>

                {visibleNotifications.map((note) => (
                  <NotificationCard
                    key={note.id}
                    note={note}
                    selected={selectedIds.has(note.id)}
                    onToggle={toggleSelect}
                    onMarkRead={handleSingleMarkRead}
                    onArchive={handleSingleArchive}
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
                  className="w-full sm:w-auto"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load more ({totalFiltered - visibleCount} remaining)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Showing {visibleCount} of {totalFiltered}
                </p>
              </div>
            )}

            {/* Settings footer */}
            <div className="mt-10 border-t border-border/60 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Notification preferences</p>
                    <p className="text-xs text-muted-foreground">
                      Manage which notifications you receive and how.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/account/notifications/">
                      <Settings className="h-4 w-4" />
                      Manage preferences
                    </Link>
                  </Button>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}