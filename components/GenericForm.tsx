'use client';

import { useForm, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type GenericFormField<T> = {
  name: keyof T & string;
  label: string;
  type: 'text' | 'password' | 'email';
  placeholder?: string;
};

export type GenericFormProps<T extends Record<string, unknown>> = {
  schema: z.ZodType<T>;
  fields: GenericFormField<T>[];
  submitLabel: string;
  onSubmit: (values: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
};

export function GenericForm<T extends Record<string, unknown>>({
  schema,
  fields,
  submitLabel,
  onSubmit,
  defaultValues,
}: GenericFormProps<T>) {
  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<T>,
    defaultValues: (defaultValues ?? {}) as DefaultValues<T>,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name as never}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" className="mt-2">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
