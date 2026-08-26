import React from "react";
import { Disc3 } from "lucide-react";

export function EmptyState({ title = "Nothing here yet", message, action }) {
  return (
    <div className="empty-state" role="status">
      <Disc3 size={48} className="empty-state__icon" />
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && (
        <a href={action.href} className="button button--primary" style={{ marginTop: "20px" }}>
          {action.label}
        </a>
      )}
    </div>
  );
}
