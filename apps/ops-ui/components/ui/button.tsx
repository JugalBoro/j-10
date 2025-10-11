import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:shadow-focus disabled:opacity-60 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600",
        outline: "border border-gray-300 text-gray-900 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
        ghost: "bg-transparent text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base"
      },
      block: { 
        true: "w-full" 
      }
    },
    defaultVariants: { 
      variant: "primary", 
      size: "md" 
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, block, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };