import { Fragment, useState } from 'react'
import type React from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ResumeFormValues } from '../data/schema'
import { resumeFormConfig, options } from '../data/config'
import { TagInput, type Tag } from 'emblor'
import { SelectDropdown } from '@/components/select-dropdown'

type Props = {
  sectionKey?: 'basic' | 'interests' | 'workSkills' | 'self'
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  readOnly?: boolean
}

export default function DynamicBasicForm(props: Props) {
  const { sectionKey = 'basic', readOnly = false } = props
  const form = useFormContext<ResumeFormValues>()
  const section = resumeFormConfig.sections.find((s) => s.key === sectionKey)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  if (!section || !section.fields) return null

  const gridCols = section.gridCols ?? 2
  const gridClass = gridCols === 1 ? 'grid grid-cols-1 md:grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2'

  const parseTags = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[]
    if (typeof value === 'string' && value) {
      return String(value)
        .split(/[，、,\s]+/u)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }

  

  return (
    <div className={gridClass + ' gap-4 items-start'}>
      {section.fields.map((field) => (
        <Fragment key={field.key as string}>
          <FormField<ResumeFormValues, FieldPath<ResumeFormValues>>
            control={form.control}
            name={field.key as FieldPath<ResumeFormValues>}
            render={({ field: rhfField }) => (
              <FormItem className={'w-full space-y-2 ' + (field.colSpan === 2 ? 'md:col-span-2' : '')}>
                {!field.hideLabel ? <FormLabel>{field.label}</FormLabel> : null}
                {field.component === 'input' && (
                  <FormControl>
                    <Input placeholder={field.placeholder} disabled={readOnly || field.disabled} value={(rhfField.value as string) ?? ''} onChange={rhfField.onChange} onBlur={rhfField.onBlur} name={rhfField.name} ref={rhfField.ref} />
                  </FormControl>
                )}
                {field.component === 'textarea' && (
                  <FormControl>
                    <Textarea rows={4} placeholder={field.placeholder} disabled={readOnly || field.disabled} value={(rhfField.value as string) ?? ''} onChange={rhfField.onChange} onBlur={rhfField.onBlur} name={rhfField.name} ref={rhfField.ref} />
                  </FormControl>
                )}
                {field.component === 'select' && (
                  <SelectDropdown
                    isControlled
                    value={(rhfField.value as string) ?? undefined}
                    onValueChange={rhfField.onChange}
                    placeholder={field.placeholder}
                    disabled={readOnly || field.disabled}
                    className='w-full h-9'
                    items={(field.optionsKey ? options[field.optionsKey] : []).map((opt) => ({ label: opt, value: opt }))}
                  />
                )}
                {field.component === 'tags' && (
                  <FormControl>
                    <div className='w-full'>
                      {/* emblor TagInput 需要 tags/setTags 与 activeTagIndex/setActiveTagIndex */}
                      <TagInput
                        placeholder={field.placeholder ?? ''}
                        tags={parseTags(rhfField.value).map((text, idx) => ({ id: `${idx}`, text })) as Tag[]}
                        setTags={(updater) => {
                          const nextTags = typeof updater === 'function' ? (updater as (prev: Tag[]) => Tag[])(parseTags(rhfField.value).map((t, i) => ({ id: `${i}`, text: t }))) : (updater as Tag[])
                          const nextTexts = nextTags.map((t) => t.text).filter(Boolean)
                          rhfField.onChange(nextTexts.join('、'))
                        }}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                        styleClasses={{
                          input: 'px-2 w-full border-none shadow-none focus-visible:outline-none',
                          inlineTagsContainer: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        }}
                      />
                    </div>
                  </FormControl>
                )}
                {field.hint ? (
                  <div className='flex items-center gap-1'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3 w-3 text-muted-foreground'>
                      <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                      <path d='m9 11 3 3L22 4'></path>
                    </svg>
                    <span className='text-xs text-muted-foreground'>{field.hint}</span>
                  </div>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </Fragment>
      ))}
    </div>
  )
}


