'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup } from '@/components/ui/field';
import { signIn } from '@/lib/auth-client';
import { useState } from 'react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-10', className)} {...props}>
      <FieldGroup className="gap-8">
        <div className="flex flex-col items-center text-center">
          <h1
            className="text-7xl leading-none font-black tracking-tighter sm:text-8xl"
            style={{
              fontFamily:
                'Playfair Display, Georgia, Cambria, Times New Roman, Times, serif',
            }}
          >
            16
            <span className="mt-2 block text-5xl font-light tracking-[0.2em] uppercase sm:text-6xl">
              Chats
            </span>
          </h1>
        </div>
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="h-12 w-full text-base font-medium tracking-wide"
          >
            {isLoading ? (
              <div className="border-muted-foreground border-t-foreground size-4 animate-spin rounded-full border-2" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            Sign in with Google
          </Button>
        </Field>
      </FieldGroup>
    </div>
  );
}
