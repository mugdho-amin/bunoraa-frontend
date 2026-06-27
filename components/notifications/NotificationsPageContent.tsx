"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/notifications/useNotifications";
import { AuthGate } from "@/components/auth/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function NotificationsPageContent() {
  const [showUnread, setShowUnread] = React.useState(false);
  const [category, setCategory] = React.useState("all");

  const { notificationsQuery, markAllRead, markRead } = useNotifications(
    {
      unread: showUnread || undefined,
      category: category !== "all" ? category : undefined,
    },
    {
      includeList: true,
      includeUnread: false,
    }
  );
  const [selected, setSelected] = React.useState<string[]>([]);

  const notifications = notificationsQuery.data || [];

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <AuthGate title="Notifications" description="Sign in to view notifications.">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">
            Notifications
          </p>
          <h1 className="text-3xl font-semibold">Your updates</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all read
          </Button>
          <Button
            variant="ghost"
            onClick={() => markRead.mutate(selected)}
            disabled={selected.length === 0 || markRead.isPending}
          >
            Mark selected
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Button
          variant={showUnread ? "primary" : "secondary"}
          size="sm"
          onClick={() => setShowUnread((prev) => !prev)}
        >
          {showUnread ? "Unread only" : "All"}
        </Button>
        <label className="flex items-center gap-2">
          <span className="text-foreground/70">Category</span>
          <select
            className="rounded-lg border border-border bg-card px-3 py-1 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All</option>
            <option value="transactional">Transactional</option>
            <option value="marketing">Marketing</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>

      {notificationsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" aria-hidden />
          <p className="mt-4 text-sm text-foreground/60">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-14 w-14 text-foreground/20 mb-4" aria-hidden />
          <h2 className="text-xl font-semibold">No notifications yet</h2>
          <p className="mt-2 max-w-sm text-sm text-foreground/60">
            We'll let you know when there are updates on your orders, preorders, or artisan collections.
          </p>
          <Link
            href="/products/"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse products
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => (
            <Card
              key={note.id}
              variant="bordered"
              className={`flex items-start justify-between gap-4 p-4 ${
                note.is_read ? "opacity-70" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">
                    {note.title || "Notification"}
                  </h2>
                  {note.category ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-foreground/70">
                      {note.category}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-foreground/70">{note.message}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.includes(note.id)}
                onChange={() => toggle(note.id)}
              />
            </Card>
          ))}
        </div>
      )}
      </div>
    </AuthGate>
  );
}
