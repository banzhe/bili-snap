import { splitProps, type ComponentProps } from 'solid-js'
import { cn } from '@/lib/utils'

export function Card(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return (
    <div
      class={cn('flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm', local.class)}
      {...others}
    />
  )
}

export function CardHeader(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return <div class={cn('grid auto-rows-min items-start gap-1.5 px-6', local.class)} {...others} />
}

export function CardTitle(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return <div class={cn('leading-none font-semibold', local.class)} {...others} />
}

export function CardDescription(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return <div class={cn('text-sm text-muted-foreground', local.class)} {...others} />
}

export function CardContent(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return <div class={cn('px-6', local.class)} {...others} />
}

export function CardFooter(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class'])
  return <div class={cn('flex items-center gap-2 px-6', local.class)} {...others} />
}
