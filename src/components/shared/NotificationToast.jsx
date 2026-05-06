import React from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useNotification() {
  const { toast } = useToast();

  // eslint-disable-next-line no-unused-vars
  const notify = (title, description, variant = 'default') => {
    // notifications silenced
  };

  return { notify };
}