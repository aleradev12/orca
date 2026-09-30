export function FocusUnreadIndicator({ isUnread }: { isUnread: boolean }) {
  // The exact flag passed to Projects' bell. Terminal liveness and the
  // working/done/active status resolver are deliberately not involved.
  if (!isUnread) {
    return null
  }
  return (
    <span
      data-focus-unread
      role="img"
      aria-label="Unread"
      className="block size-2.5 rounded-full bg-amber-500"
    />
  )
}
