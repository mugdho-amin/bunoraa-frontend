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
  Search,
  X,
  Loader2,
  RefreshCw,
  Settings,
  Inbox,
  CreditCard,
  Check,
  Clock,
  BellOff,
  Trash2,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationFilters } from "@/components/notifications/useNotifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/AuthGate";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const TABS = ["all", "unread"] as const;
type Tab = (typeof TABS)[number];

const TYPE_ICONS: Record<string, LucideIcon> = {
  system: Bell,
  order: ShoppingBag,
  promotion: Tag,
  marketing: MessageSquare,
  transactional: CreditCard,
  custom: Info,
  alert: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  order: "text-blue-600 dark:text-blue-400",
  promotion: "text-amber-600 dark:text-amber-400",
  system: "text-zinc-500 dark:text-zinc-400",
  marketing: "text-violet-600 dark:text-violet-400",
  transactional: "text-emerald-600 dark:text-emerald-400",
  custom: "text-zinc-500 dark:text-zinc-400",
  alert: "text-rose-600 dark:text-rose-400",
};

const TYPE_BG: Record<string, string> = {
  order: "bg-blue-50 dark:bg-blue-500/10",
  promotion: "bg-amber-50 dark:bg-amber-500/10",
  system: "bg-zinc-100 dark:bg-zinc-500/10",
  marketing: "bg-violet-50 dark:bg-violet-500/10",
  transactional: "bg-emerald-50 dark:bg-emerald-500/10",
  custom: "bg-zinc-100 dark:bg-zinc-500/10",
  alert: "bg-rose-50 dark:bg-rose-500/10",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTypeKey(note: NotificationItem): string {
  return (note.type || note.category || "system").toLowerCase();
}

function getIconForNotification(note: NotificationItem): LucideIcon {
  return TYPE_ICONS[getTypeKey(note)] || Bell;
}

function getTypeColor(note: NotificationItem): string {
  return TYPE_COLORS[getTypeKey(note)] || "text-zinc-500 dark:text-zinc-400";
}

function getTypeBg(note: NotificationItem): string {
  return TYPE_BG[getTypeKey(note)] || "bg-zinc-100 dark:bg-zinc-500/10";
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
    return diffHours === 1 ? "1h ago" : `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getTimeGroup(dateStr?: string | null): string {
  if (!dateStr) return "Older";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (noteDay.getTime() === today.getTime()) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "This month";
  return "Older";
}

function groupNotifications(notes: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const groups: Record<string, NotificationItem[]> = {};
  for (const note of notes) {
    const group = getTimeGroup(note.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(note);
  }
  const order = ["Today", "Yesterday", "This week", "This month", "Older"];
  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, items: groups[label] }));
}

function filterBySearch(note: NotificationItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    (note.title || "").toLowerCase().includes(q) ||
    (note.message || "").toLowerCase().includes(q)
  );
}

function sortNotifications(notes: NotificationItem[]): NotificationItem[] {
  return [...notes].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-12 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function NotificationRow({
  note,
  selected,
  onToggle,
  onMarkRead,
  onArchive,
  onDelete,
}: {
  note: NotificationItem;
  selected: boolean;
  onToggle: (id: string) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isUnread = !note.is_read;
  const IconComponent = getIconForNotification(note);
  const iconColor = getTypeColor(note);
  const iconBg = getTypeBg(note);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 rounded-xl px-4 py-3.5 transition-colors duration-150",
        "hover:bg-muted/50",
        isUnread && "bg-primary/[0.03]"
      )}
    >
      {/* Checkbox */}
      <label className="relative mt-0.5 flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(note.id)}
          className="peer sr-only"
          aria-label={`Select: ${note.title || "notification"}`}
        />
        <span
          className={cn(
            "flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all duration-150",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border group-hover:border-foreground/30",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </label>

      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          iconBg
        )}
      >
        <IconComponent className={cn("h-[18px] w-[18px]", iconColor)} strokeWidth={1.8} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm leading-snug",
                isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
              )}
            >
              {note.title || "Notification"}
            </p>
            {note.message && (
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {note.message}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Timestamp */}
            <span className="whitespace-nowrap text-xs text-muted-foreground/70">
              {formatRelativeTime(note.created_at)}
            </span>

            {/* Unread dot */}
            {isUnread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
            )}

            {/* Overflow menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                  {note.url && (
                    <Link
                      href={note.url}
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                      View details
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => { onMarkRead(note.id); setShowMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <CheckCheck className="h-4 w-4 text-muted-foreground" />
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onArchive(note.id); setShowMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    {note.is_archived ? "Restore" : "Archive"}
                  </button>
                  <div className="my-1 h-px bg-border/60" />
                  <button
                    type="button"
                    onClick={() => { onDelete(note.id); setShowMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function NotificationsPageContent() {
  const [activeTab, setActiveTab] = React.useState<Tab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const queryClient = useQueryClient();

  const hookFilters = React.useMemo<NotificationFilters>(() => {
    if (activeTab === "unread") return { unread: true };
    return {};
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

  const notifications = React.useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = unreadCountQuery.data?.count ?? 0;

  const filtered = React.useMemo(() => {
    let result = sortNotifications(notifications);
    if (searchQuery) {
      result = result.filter((n) => filterBySearch(n, searchQuery));
    }
    return result;
  }, [notifications, searchQuery]);

  const totalFiltered = filtered.length;
  const visibleNotifications = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < totalFiltered;
  const groups = React.useMemo(() => groupNotifications(visibleNotifications), [visibleNotifications]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeTab]);

  // Selection
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
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(visibleNotifications.map((n) => n.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleMarkSelectedRead = () => {
    if (selectedIds.size === 0) return;
    markRead.mutate(Array.from(selectedIds));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <AuthGate
      title="Notifications"
      description="Sign in to view your notifications."
    >
      <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || unreadCount === 0}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                aria-label="Notification preferences"
              >
                <Link href="/account/notifications/">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="mb-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "all" ? "All" : "Unread";
              const count = tab === "all" ? totalFiltered : unreadCount;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); clearSelection(); }}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputSize="sm"
              className="pl-10 pr-9"
              aria-label="Search notifications"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {isAllSelected ? "Deselect all" : "Select all"}
              </Button>
              <div className="mx-1 h-4 w-px bg-border/60" />
              <Button variant="ghost" size="sm" onClick={handleMarkSelectedRead} disabled={markRead.isPending}>
                {markRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Mark read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={deleteMutation.isPending}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={clearSelection} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Notification list / states */}
        {notificationsQuery.isLoading ? (
          <NotificationSkeleton />
        ) : notificationsQuery.isError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-20 text-center">
            <AlertTriangle className="mb-4 h-10 w-10 text-amber-500" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-foreground">Failed to load notifications</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Something went wrong while fetching your notifications.
            </p>
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => notificationsQuery.refetch()} loading={notificationsQuery.isRefetching}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {searchQuery ? (
                <Search className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.5} />
              ) : (
                <BellOff className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.5} />
              )}
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {searchQuery ? "No results found" : activeTab === "unread" ? "No unread notifications" : "You're all caught up"}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term."
                : activeTab === "unread"
                  ? "All caught up — nothing new to review."
                  : "We'll notify you when there are updates on your orders and account."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {searchQuery ? (
                <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/products/">Browse products</Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select all */}
            <div className="flex items-center px-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="peer sr-only"
                  aria-label="Select all"
                />
                <span
                  className={cn(
                    "flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all",
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

            {/* Grouped notifications */}
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-1.5 px-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {group.items.map((note) => (
                    <NotificationRow
                      key={note.id}
                      note={note}
                      selected={selectedIds.has(note.id)}
                      onToggle={toggleSelect}
                      onMarkRead={(id) => markRead.mutate([id])}
                      onArchive={(id) => archiveMutation.mutate([id])}
                      onDelete={(id) => deleteMutation.mutate([id])}
                    />
                  ))}
                </div>
              </div>
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
              <Inbox className="h-4 w-4" />
              Load more
            </Button>
            <p className="text-xs text-muted-foreground">
              Showing {visibleNotifications.length} of {totalFiltered}
            </p>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
