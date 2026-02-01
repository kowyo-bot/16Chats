import * as React from "react"
import { cn } from "@/lib/utils"

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-5", className)}
      {...props}
    />
  )
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FieldMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-message"
      className={cn("text-destructive text-sm font-medium", className)}
      {...props}
    />
  )
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("relative text-center text-sm", className)}
      {...props}
    >
      <div className="absolute inset-0 top-1/2 border-t" />
      <span className="bg-background text-muted-foreground relative px-2">
        {children}
      </span>
    </div>
  )
}

export {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldMessage,
  FieldSeparator,
}
