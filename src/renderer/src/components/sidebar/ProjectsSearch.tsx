import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PROJECTS_SEARCH_MAX_LENGTH } from './projects-search'

export function ProjectsSearch({
  value,
  onChange
}: {
  value: string
  onChange: (query: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="relative mx-3 mb-2 mt-1 shrink-0" role="search" aria-label="Projects">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={input}
        type="search"
        aria-label="Search projects, branches and paths"
        placeholder="Search projects…"
        title="Fuzzy search: branch, project name or project folder path"
        value={value}
        maxLength={PROJECTS_SEARCH_MAX_LENGTH}
        spellCheck={false}
        autoComplete="off"
        className="h-7 pl-7 pr-7 text-xs [&::-webkit-search-cancel-button]:hidden"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            event.stopPropagation()
            onChange('')
          }
        }}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Clear project search"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}
