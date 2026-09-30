import { lazy, Suspense, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFocusStore } from './use-focus-store'
import type { FocusPin } from './focus-state'

const FullEmojiPicker = lazy(() =>
  import('../../settings/RepositoryIconEmojiPicker').then((module) => ({
    default: module.RepositoryIconEmojiPicker
  }))
)
const QUICK_EMOJI = [
  '🔴',
  '🟠',
  '🟡',
  '🟢',
  '🔵',
  '🟣',
  '🟤',
  '⚫',
  '⚪',
  '🔺',
  '🟥',
  '🟧',
  '🟨',
  '🟩',
  '🟦',
  '🟪',
  '🟫',
  '⬛',
  '⬜',
  '🔷',
  '🚀',
  '🛠️',
  '🐛',
  '📦',
  '🧪',
  '🌱',
  '💡',
  '🎯',
  '⭐',
  '🌊'
]

export function FocusPicker({ pin, onSaved }: { pin: FocusPin; onSaved: () => void }) {
  const [label, setLabel] = useState(pin.label)
  const [expanded, setExpanded] = useState(false)
  const inputId = useId()
  const savePin = useFocusStore((state) => state.savePin)
  const error = useFocusStore((state) => state.error)
  function save(emoji: string) {
    if (savePin({ ...pin, emoji, label: label.trim() })) {
      onSaved()
    }
  }
  return (
    <div
      className="w-72 space-y-3 p-2"
      data-focus-picker
      onKeyDown={(event) => {
        if (event.key !== 'Escape') {
          event.stopPropagation()
        }
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={inputId}>Label</Label>
        <Input
          id={inputId}
          value={label}
          maxLength={120}
          placeholder={pin.name}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') {
              event.stopPropagation()
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              save(pin.emoji)
            }
          }}
        />
      </div>
      <div className="grid grid-cols-10 gap-1" aria-label="Quick emoji">
        {QUICK_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Focus ${emoji}`}
            onClick={() => save(emoji)}
            className="flex aspect-square items-center justify-center rounded-md text-base hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Fewer emoji' : 'All emoji…'}
        </Button>
        <Button size="xs" onClick={() => save(pin.emoji)}>
          Save {pin.emoji}
        </Button>
      </div>
      {expanded && (
        <Suspense fallback={<p className="text-xs text-muted-foreground">Loading emoji…</p>}>
          <FullEmojiPicker
            selectedEmoji={pin.emoji}
            onSetIcon={(icon) => {
              if (icon?.type === 'emoji') {
                save(icon.emoji)
              }
            }}
          />
        </Suspense>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
