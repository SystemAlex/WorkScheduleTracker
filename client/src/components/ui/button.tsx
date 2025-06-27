import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, colorLightenDarken, getCssVarValue } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        outline: 'border',
        secondary: '',
        ghost: '',
        link: '',
        custom: '',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  colorVariant?: string;
}

function getVariantColor(variant: string): string {
  const cssMap: Record<string, string> = {
    default: '--primary',
    destructive: '--destructive',
    secondary: '--secondary',
    ghost: '--muted',
    link: '--primary',
  };

  const hexFallback: Record<string, string> = {
    default: '#3B82F6',
    destructive: '#EF4444',
    secondary: '#6B7280',
    ghost: '#F3F4F6',
    link: '#3B82F6',
  };

  const cssVar = cssMap[variant];
  const cssValue = cssVar ? getCssVarValue(cssVar) : '';
  return cssValue || hexFallback[variant] || '#3B82F6';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size,
      colorVariant,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const resolvedColor = colorVariant || getVariantColor(variant || 'default');
    const hoverBg = colorLightenDarken(resolvedColor, 0.85);
    const hoverText = colorLightenDarken(resolvedColor, 1);
    const hoverBorder = colorLightenDarken(resolvedColor, 1);

    const isStyled =
      variant !== 'link' && variant !== 'outline' && variant !== 'ghost';

    const style: React.CSSProperties = isStyled
      ? {
          backgroundColor: resolvedColor,
          color: colorLightenDarken(resolvedColor, 0.85),
          border: `1px solid ${resolvedColor}`,
        }
      : variant === 'outline'
        ? {
            color: resolvedColor,
            border: `1px solid ${resolvedColor}`,
          }
        : variant === 'ghost'
          ? {
              backgroundColor: 'transparent',
              color: 'var(--muted-foreground)',
            }
          : {};

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        style={style}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (variant === 'outline') {
            el.style.backgroundColor = hoverBg;
            el.style.color = hoverText;
            el.style.borderColor = hoverBorder;
          } else if (isStyled) {
            el.style.backgroundColor = hoverBg;
            el.style.borderColor = hoverBorder;
            el.style.color = hoverText;
          } else if (variant === 'ghost') {
            el.style.backgroundColor = 'var(--accent)';
            el.style.color = 'var(--accent-foreground)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (variant === 'outline') {
            el.style.backgroundColor = 'transparent';
            el.style.color = resolvedColor;
            el.style.borderColor = resolvedColor;
          } else if (isStyled) {
            el.style.backgroundColor = resolvedColor;
            el.style.borderColor = resolvedColor;
            el.style.color = colorLightenDarken(resolvedColor, 0.85);
          } else if (variant === 'ghost') {
            el.style.backgroundColor = 'transparent';
            el.style.color = 'var(--muted-foreground)';
          }
        }}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
