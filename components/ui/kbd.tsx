import { splitProps, type ComponentProps } from 'solid-js';
import { cn } from '@/lib/utils';

export function Kbd(props: ComponentProps<'kbd'>) {
  const [local, others] = splitProps(props, ['class']);
  return (
    <kbd
      class={cn(
        'pointer-events-none inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-sm border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground select-none',
        local.class,
      )}
      {...others}
    />
  );
}

export function KbdGroup(props: ComponentProps<'span'>) {
  const [local, others] = splitProps(props, ['class']);
  return <span class={cn('inline-flex items-center gap-1', local.class)} {...others} />;
}
