import * as AlertPrimitive from '@kobalte/core/alert';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import { cva, type VariantProps } from 'class-variance-authority';
import { splitProps, type ComponentProps, type JSX, type ValidComponent } from 'solid-js';
import { cn } from '@/lib/utils';

export const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        warning: 'border-warning/40 bg-warning/10 text-warning [&_[data-slot=alert-description]]:text-warning/90',
        destructive:
          'border-destructive/40 bg-destructive/10 text-destructive [&_[data-slot=alert-description]]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type AlertProps<T extends ValidComponent = 'div'> = AlertPrimitive.AlertRootProps<T> &
  VariantProps<typeof alertVariants> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

export function Alert<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, AlertProps<T>>) {
  const [local, others] = splitProps(props as AlertProps, ['class', 'variant']);
  return <AlertPrimitive.Root class={cn(alertVariants({ variant: local.variant }), local.class)} {...others} />;
}

export function AlertTitle(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class']);
  return <div class={cn('col-start-2 min-h-4 font-medium tracking-tight', local.class)} {...others} />;
}

export function AlertDescription(props: ComponentProps<'div'>) {
  const [local, others] = splitProps(props, ['class']);
  return (
    <div
      data-slot="alert-description"
      class={cn('col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed', local.class)}
      {...others}
    />
  );
}
