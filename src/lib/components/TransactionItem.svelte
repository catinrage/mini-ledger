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
  }: {
    id: string;
    party: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: Date;
    balance: number;
  } = $props();
</script>

<div class="flex flex-col gap-2 border-b border-dashed border-black/5 p-4 duration-75 hover:bg-slate-100">
  <div class="flex w-full items-center">
    <div class="w-1/4">{party}</div>
    <div class="w-1/6">{currencyNumberFormatter(amount)}</div>
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
    <div class="w-1/12 pr-2">
      <button
        class=" flex items-center text-sm text-black/60 duration-75 hover:text-rose-500"
        formaction="?/deleteTransaction"
        name="id"
        value={id}
      >
        <iconify-icon icon="material-symbols:contract-delete-outline-rounded"></iconify-icon>
      </button>
    </div>
  </div>
  {#if description.replaceAll(' ', '') !== ''}
    <div class="rounded bg-gray-50 p-3 text-us text-black/50">
      {description}
    </div>
  {/if}
</div>
