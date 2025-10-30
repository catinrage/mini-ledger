<script lang="ts">
  import { currencyNumberFormatter } from '$lib/helpers';
  import type { TransactionType } from '@prisma/client';
  const {
    id,
    party,
    amount,
    type,
    description,
    date,
    balance,
    includeInBalance,
    onEdit,
  }: {
    id: string;
    party: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: Date;
    balance: number;
    includeInBalance: boolean;
    onEdit?: (transaction: any) => void;
  } = $props();
</script>

<div
  class="flex flex-col gap-2 border-b border-dashed border-black/5 p-4 duration-75 hover:bg-slate-100"
  class:opacity-50={!includeInBalance}
>
  <div class="flex w-full items-center">
    <div class="w-12 flex-shrink-0 pr-1">
      <input
        type="checkbox"
        checked={includeInBalance}
        onchange={(e) => {
          const checkbox = e.currentTarget;
          const form = checkbox.closest('form');
          if (form) {
            // Create a hidden input for the action
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'id';
            actionInput.value = id;

            const includeInput = document.createElement('input');
            includeInput.type = 'hidden';
            includeInput.name = 'includeInBalance';
            includeInput.value = String(checkbox.checked);

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
        }}
        class="h-4 w-4 cursor-pointer accent-accent-600"
        title="شامل در محاسبه تراز"
      />
    </div>
    <div class="w-1/5" class:line-through={!includeInBalance}>{party}</div>
    <div class="w-1/6" class:line-through={!includeInBalance}>{currencyNumberFormatter(amount)}</div>
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
      {new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'persian',
      }).format(date)}
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
          onclick={() => onEdit?.({ id, party, amount, type, description, date, balance })}
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
  {#if description.replaceAll(' ', '') !== ''}
    <div class="rounded bg-gray-50 p-3 text-us text-black/50">
      {description}
    </div>
  {/if}
</div>
