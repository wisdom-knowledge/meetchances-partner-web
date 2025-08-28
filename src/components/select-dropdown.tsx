import { useMemo, useState } from 'react'
import { IconLoader } from '@tabler/icons-react'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormControl } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SelectDropdownProps {
  onValueChange?: (value: string) => void
  value?: string
  defaultValue?: string
  placeholder?: string
  isPending?: boolean
  items: { label: string; value: string }[] | undefined
  disabled?: boolean
  className?: string
  isControlled?: boolean
}

export function SelectDropdown({
  value,
  defaultValue,
  onValueChange,
  isPending,
  items,
  placeholder,
  disabled,
  className = '',
  isControlled = false,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue)

  const currentValue = isControlled ? value : uncontrolledValue

  const selectedLabel = useMemo(() => {
    if (!items || !currentValue) return undefined
    const match = items.find((it) => it.value === currentValue)
    return match?.label
  }, [items, currentValue])

  const handleSelect = (value: string) => {
    if (!isControlled) {
      setUncontrolledValue(value)
    }
    onValueChange?.(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            disabled={disabled}
            className={cn('justify-between', !selectedLabel && 'text-muted-foreground', className)}
          >
            {selectedLabel ?? placeholder ?? 'Select'}
            <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className='min-w-56 p-0'>
        {isPending ? (
          <div className='h-14 flex items-center justify-center gap-2'>
            <IconLoader className='h-5 w-5 animate-spin' />
            Loading...
          </div>
        ) : (
          <div className='max-h-64 overflow-auto py-1'>
            {items?.map(({ label, value }) => {
              const isActive = value === currentValue
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => handleSelect(value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <CheckIcon
                    className={cn('h-4 w-4', isActive ? 'opacity-100' : 'opacity-0')}
                  />
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
