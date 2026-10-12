import { splitProps, type ComponentProps } from 'solid-js'
import { cn } from '@/lib/utils'

export function Table(props: ComponentProps<'table'>) {
  const [local, others] = splitProps(props, ['class'])
  return (
    <div class="relative w-full overflow-x-auto">
      <table class={cn('w-full caption-bottom text-sm', local.class)} {...others} />
    </div>
  )
}

export function TableHeader(props: ComponentProps<'thead'>) {
  const [local, others] = splitProps(props, ['class'])
  return <thead class={cn('[&_tr]:border-b', local.class)} {...others} />
}

export function TableBody(props: ComponentProps<'tbody'>) {
  const [local, others] = splitProps(props, ['class'])
  return <tbody class={cn('[&_tr:last-child]:border-0', local.class)} {...others} />
}

export function TableRow(props: ComponentProps<'tr'>) {
  const [local, others] = splitProps(props, ['class'])
  return <tr class={cn('border-b transition-colors hover:bg-muted/50', local.class)} {...others} />
}

export function TableHead(props: ComponentProps<'th'>) {
  const [local, others] = splitProps(props, ['class'])
  return (
    <th
      class={cn('h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground', local.class)}
      {...others}
    />
  )
}

export function TableCell(props: ComponentProps<'td'>) {
  const [local, others] = splitProps(props, ['class'])
  return <td class={cn('p-2 align-middle', local.class)} {...others} />
}
