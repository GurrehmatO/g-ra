"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/ui/fields";

export type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

export default function CommentList({
  ticketId,
  comments,
  onAdded,
}: {
  ticketId: string;
  comments: CommentData[];
  onAdded: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPosting(true);
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setPosting(false);
    if (!res.ok) {
      setError("Failed to post comment");
      return;
    }
    setBody("");
    onAdded();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={post} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={posting}>
          {posting ? "Posting…" : "Comment"}
        </Button>
      </form>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="rounded-md border border-border p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium">{c.author.name ?? c.author.email}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="whitespace-pre-wrap">{c.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
