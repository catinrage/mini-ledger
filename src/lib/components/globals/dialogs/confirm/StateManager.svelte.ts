import { getContext, setContext } from 'svelte';
import { tweened } from 'svelte/motion';
import { get } from 'svelte/store';

export class ConfirmDialogStateManager {
  private _resolve: (value: boolean) => void = () => {};

  public isOpen = $state(false);
  public message = $state('');
  public confirmText = $state('');
  public type: 'Normal' | 'Danger' = $state('Normal');
  public cooldown = $state(tweened(1, { duration: 3000 }));

  public open({
    type,
    message,
    confirmText,
  }: {
    type: 'Normal' | 'Danger';
    message: string;
    confirmText?: string;
  }) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.type = type;
    this.message = message;
    this.confirmText = confirmText || 'تایید میکنم';
    this.cooldown.set(0, { duration: 3000 });
    return new Promise<boolean>((resolve) => {
      this._resolve = resolve;
    });
  }

  public confirm() {
    if (this.type === 'Danger' && get(this.cooldown) > 0) return;
    this._resolve(true);
    this.close();
  }

  public cancel() {
    this._resolve(false);
    this.close();
  }

  public close() {
    this.isOpen = false;
    this.cooldown.set(1, { duration: 0 });
  }
}

const CONTEXT_KEY = Symbol('confirm-dialog');

export function setConfirmDialogStateManager() {
  return setContext(CONTEXT_KEY, new ConfirmDialogStateManager());
}

export function getConfirmDialogStateManager() {
  return getContext<ReturnType<typeof setConfirmDialogStateManager>>(CONTEXT_KEY);
}
