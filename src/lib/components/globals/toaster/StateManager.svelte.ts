import { getContext, setContext } from 'svelte';
import type { Tweened } from 'svelte/motion';
import { tweened } from 'svelte/motion';

export type ToastType = 'info' | 'success' | 'delete' | 'error';

export type Toast = {
  id: symbol;
  type: ToastType;
  message: string;
  ttl: Tweened<number>;
};

export class ToasterStateManager {
  public toasts = $state<Toast[]>([]);
  public timers = new Map<symbol, ReturnType<typeof setTimeout>>();

  public add = ({
    type,
    message,
    duration = 5000,
  }: {
    type: ToastType;
    message: string;
    duration: number;
  }) => {
    const toast = {
      id: Symbol(),
      type,
      message,
      ttl: tweened(1, { duration }),
    };
    toast.ttl.set(0);
    this.toasts.push(toast);
    this.timers.set(
      toast.id,
      setTimeout(() => this.remove(toast.id), duration),
    );
  };

  public remove = (id: symbol) => {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  };

  public clear = () => {
    this.toasts = [];
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  };
}

const CONTEXT_KEY = Symbol('toaster');

export function setToasterStateManager() {
  return setContext(CONTEXT_KEY, new ToasterStateManager());
}

export function getToasterStateManager() {
  return getContext<ReturnType<typeof setToasterStateManager>>(CONTEXT_KEY);
}
