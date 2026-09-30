import { Grid2X2, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FocusDocument } from './focus-state'

export function FocusViewToggle({
  mode,
  disabled,
  onChange
}: {
  mode: FocusDocument['mode']
  disabled?: boolean
  onChange: (mode: FocusDocument['mode']) => void
}) {
  const nextMode = mode === 'grid' ? 'list' : 'grid'
  const action = `Switch to ${nextMode} view`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-focus-view-toggle
          data-current-view={mode}
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          aria-label={action}
          className="text-muted-foreground"
          onClick={() => onChange(nextMode)}
        >
          {nextMode === 'grid' ? <Grid2X2 className="size-3.5" /> : <List className="size-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{action}</TooltipContent>
    </Tooltip>
  )
}
