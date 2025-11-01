<script lang="ts">
  import type { TransactionType } from '@prisma/client';
  import CircularCheckbox from './CircularCheckbox.svelte';
  import DateSelector from './DateSelector.svelte';
  import TransactionSelector from './TransactionSelector.svelte';

  type DueDateMode = 'none' | 'fixed' | 'relative';

  let {
    mode = $bindable<DueDateMode>('none'),
    fixedDate = $bindable<Date>(new Date()),
    relativeTransactionId = $bindable<string>(''),
    relativeOffsetDays = $bindable<number>(0),
    transactions = [],
    currentTransactionId = undefined,
    useNames = true,
    class: className = '',
  }: {
    mode?: DueDateMode;
    fixedDate?: Date;
    relativeTransactionId?: string;
    relativeOffsetDays?: number;
    transactions?: Array<{
      id: string;
      party: string;
      amount: number;
      type: TransactionType;
      dueDateResolved?: Date | null;
    }>;
    currentTransactionId?: string;
    useNames?: boolean;
    class?: string;
  } = $props();

  function handleModeChange(newMode: DueDateMode) {
    if (mode === newMode) {
      mode = 'none';
    } else {
      mode = newMode;
    }
  }
</script>

<div class="flex flex-col gap-3 {className}">
  <div class="flex items-center gap-3 text-xs">
    <span class="text-black/70">سررسید:</span>
    <button
      type="button"
      onclick={() => handleModeChange('fixed')}
      class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 duration-150 hover:border-accent-500"
      class:bg-accent-50={mode === 'fixed'}
      class:border-accent-600={mode === 'fixed'}
    >
      <CircularCheckbox checked={mode === 'fixed'} />
      <span>تاریخ ثابت</span>
    </button>
    <button
      type="button"
      onclick={() => handleModeChange('relative')}
      class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 duration-150 hover:border-accent-500"
      class:bg-accent-50={mode === 'relative'}
      class:border-accent-600={mode === 'relative'}
    >
      <CircularCheckbox checked={mode === 'relative'} />
      <span>نسبت به تراکنش دیگر</span>
    </button>
  </div>

  {#if mode === 'fixed'}
    <div class="flex flex-col gap-2">
      <DateSelector name={useNames ? 'date' : undefined} bind:value={fixedDate} label="تاریخ سررسید" />
      {#if useNames}
        <!-- Hidden inputs to clear relative fields when using fixed mode -->
        <input type="hidden" name="relativeDueDateTransactionId" value="" />
        <input type="hidden" name="relativeDueDateOffsetDays" value="" />
      {/if}
    </div>
  {:else if mode === 'relative'}
    <div class="flex flex-col gap-3">
      <TransactionSelector
        name={useNames ? 'relativeDueDateTransactionId' : undefined}
        bind:value={relativeTransactionId}
        {transactions}
        {currentTransactionId}
        label="تراکنش مرجع"
      />
      <div class="flex flex-col gap-1 text-xs">
        <label for="relativeDueDateOffsetDays" class="px-2 text-black/70"
          >تعداد روز فاصله (مثبت برای بعد، منفی برای قبل)</label
        >
        <input
          id="relativeDueDateOffsetDays"
          name={useNames ? 'relativeDueDateOffsetDays' : undefined}
          type="number"
          bind:value={relativeOffsetDays}
          placeholder="مثلا: 10 یا -5"
          class="rounded-lg border border-gray-300 px-3 py-2 text-black outline-none duration-150 hover:border-accent-500 focus:border-accent-600"
        />
      </div>
      {#if useNames}
        <!-- Hidden input to clear fixed date when using relative mode -->
        <input type="hidden" name="date" value="" />
      {/if}
    </div>
  {:else if useNames}
    <!-- No due date selected - clear all fields -->
    <input type="hidden" name="date" value="" />
    <input type="hidden" name="relativeDueDateTransactionId" value="" />
    <input type="hidden" name="relativeDueDateOffsetDays" value="" />
  {/if}
</div>
