<script lang="ts">
  import CircularCheckbox from '$lib/components/inputs/CircularCheckbox.svelte';
  import { currencyNumberFormatter } from '$lib/helpers';
  import type { TransactionType } from '@prisma/client';
  const {
    id,
    party,
    amount,
    type,
    description,
    balance,
    includeInBalance,
    date,
    relativeDueDateTransactionId,
    relativeDueDateOffsetDays,
    dueDateResolved,
    onEdit,
  }: {
    id: string;
    party: string;
    amount: number;
    type: TransactionType;
    description: string;
    balance: number;
    includeInBalance: boolean;
    date?: Date | null;
    relativeDueDateTransactionId?: string | null;
    relativeDueDateOffsetDays?: number | null;
    dueDateResolved?: Date | null;
    onEdit?: (transaction: any) => void;
  } = $props();

  let isIncluded = $state(includeInBalance);
  let highlightTimeout: ReturnType<typeof setTimeout> | undefined;
  let highlightedElement: HTMLElement | null = null;

  function handleCheckboxChange(checked: boolean) {
    isIncluded = checked;
    const form = document.querySelector('form');
    if (form) {
      // Create a hidden input for the action
      const actionInput = document.createElement('input');
      actionInput.type = 'hidden';
      actionInput.name = 'id';
      actionInput.value = id;

      const includeInput = document.createElement('input');
      includeInput.type = 'hidden';
      includeInput.name = 'includeInBalance';
      includeInput.value = String(checked);

      form.appendChild(actionInput);
      form.appendChild(includeInput);
      form.action = '?/toggleIncludeInBalance';
      form.requestSubmit();

      // Clean up
      setTimeout(() => {
        actionInput.remove();
        includeInput.remove();
      }, 100);
    }
  }

  function clearHighlightTimeout() {
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
      highlightTimeout = undefined;
    }
  }

  function removeHighlight() {
    if (highlightedElement) {
      highlightedElement.classList.remove('relative-highlight');
      highlightedElement = null;
    }
  }

  function scrollToReference() {
    if (!relativeDueDateTransactionId) return;
    if (typeof document === 'undefined') return;

    const target = document.querySelector<HTMLElement>(
      `[data-transaction-id="${relativeDueDateTransactionId}"]`,
    );

    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clearHighlightTimeout();
    removeHighlight();

    highlightedElement = target;
    target.classList.add('relative-highlight');

    highlightTimeout = setTimeout(() => {
      removeHighlight();
      highlightTimeout = undefined;
    }, 2000);
  }
</script>

<div
  class="flex flex-col gap-2 border-b border-dashed border-black/5 p-4 duration-75 hover:bg-slate-100"
  class:opacity-50={!isIncluded}
  data-transaction-id={id}
>
  <div class="flex w-full items-center">
    <div class="w-12 flex-shrink-0 pr-1">
      <CircularCheckbox
        bind:checked={isIncluded}
        onchange={handleCheckboxChange}
        title="شامل در محاسبه تراز"
      />
    </div>
    <div class="w-1/5" class:line-through={!isIncluded}>{party}</div>
    <div class="w-1/6" class:line-through={!isIncluded}>{currencyNumberFormatter(amount)}</div>
    <div class="w-1/6">
      {#if type === 'WITHDRAW'}
        <div class="flex w-fit items-center gap-1 rounded px-1 py-0.5 text-us text-rose-600">
          <iconify-icon class="-rotate-90" icon="uil:sign-out-alt"></iconify-icon>
          <span>پرداخت</span>
        </div>
      {:else}
        <div class="flex w-fit items-center gap-1 rounded px-1 py-0.5 text-us text-teal-600">
          <iconify-icon class="-rotate-90" icon="uil:sign-in-alt"></iconify-icon>
          <span>دریافت</span>
        </div>
      {/if}
    </div>
    <div class="w-1/6">
      {#if dueDateResolved}
        {new Intl.DateTimeFormat('fa-IR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          calendar: 'persian',
        }).format(dueDateResolved)}
      {:else}
        <span class="text-black/30">-</span>
      {/if}
    </div>
    <div class="rtl w-1/6" class:text-teal-500={balance > 0} class:text-rose-500={balance < 0}>
      <span dir="ltr">{currencyNumberFormatter(balance)}</span>
    </div>
    <div class="w-1/6 pr-2">
      <div class="flex items-center gap-1">
        <button
          class="flex items-center text-sm text-black/60 duration-75 hover:text-green-500"
          formaction="?/applyTransaction"
          name="id"
          value={id}
          title="اعمال به موجودی پایه"
        >
          <iconify-icon icon="material-symbols:check-circle-outline-rounded"></iconify-icon>
        </button>
        <button
          type="button"
          class="flex items-center text-sm text-black/60 duration-75 hover:text-blue-500"
          onclick={() =>
            onEdit?.({
              id,
              party,
              amount,
              type,
              description,
              date,
              relativeDueDateTransactionId,
              relativeDueDateOffsetDays,
              balance,
            })}
          title="ویرایش"
        >
          <iconify-icon icon="material-symbols:edit-outline-rounded"></iconify-icon>
        </button>
        <button
          class="flex items-center text-sm text-black/60 duration-75 hover:text-rose-500"
          formaction="?/deleteTransaction"
          name="id"
          value={id}
          title="حذف"
        >
          <iconify-icon icon="material-symbols:contract-delete-outline-rounded"></iconify-icon>
        </button>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    {#if description.replaceAll(' ', '') !== ''}
      <div class="rounded-full bg-gray-50 p-3 text-us text-black/50">
        {description}
      </div>
    {/if}

    {#if relativeDueDateTransactionId}
      <div
        class="flex flex-col gap-3 rounded-full bg-amber-50 p-3 text-us sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2 text-amber-800">
          <iconify-icon class="text-sm text-amber-600" icon="material-symbols:schedule"></iconify-icon>
          <span>
            {#if dueDateResolved}
              <strong>سررسید محاسبه شده:</strong>
              {new Intl.DateTimeFormat('fa-IR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                calendar: 'persian',
              }).format(new Date(dueDateResolved))}
              <span class="mr-1 text-amber-600">
                ({relativeDueDateOffsetDays || 0} روز {(relativeDueDateOffsetDays || 0) >= 0
                  ? 'بعد از'
                  : 'قبل از'} تراکنش مرجع)
              </span>
            {:else}
              <strong>سررسید محاسبه شده:</strong>
              <span class="text-amber-600">نامشخص (تراکنش مرجع سررسید ندارد)</span>
            {/if}
          </span>
        </div>
        <button
          type="button"
          class="flex items-center justify-center gap-1 rounded-lg px-3 py-0.5 text-xs font-semibold text-amber-500 duration-150 hover:text-amber-600"
          onclick={scrollToReference}
        >
          <iconify-icon icon="material-symbols:travel-explore-outline-rounded"></iconify-icon>
          <span>نمایش تراکنش مرجع</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.relative-highlight) {
    position: relative;
    background-color: #f0f9ff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    transition: outline-color 0.3s ease;
  }
</style>
