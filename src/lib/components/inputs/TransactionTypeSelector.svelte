<script lang="ts">
  import type { TransactionType } from '@prisma/client';

  let {
    name,
    value = $bindable('DEPOSIT'),
    label,
  }: { name?: string; value: TransactionType; label: string } = $props();
</script>

<div class="relative flex w-full flex-col gap-2">
  <span>{label}</span>
  <div class="relative z-[1] flex overflow-hidden rounded-lg bg-gray-100 text-xs">
    <input type="hidden" {name} bind:value />
    <div
      class="absolute left-1/2 top-0 h-full w-1/2 duration-75"
      class:bg-teal-500={value === 'DEPOSIT'}
      class:bg-rose-500={value === 'WITHDRAW'}
      class:!left-0={value === 'WITHDRAW'}
    ></div>
    <button
      class="z-10 flex w-1/2 justify-center gap-1.5 rounded-xl rounded-l-none p-1.5"
      class:text-white={value === 'DEPOSIT'}
      type="button"
      onclick={() => (value = 'DEPOSIT')}
    >
      <iconify-icon class="-rotate-90 text-sm" icon="uil:sign-in-alt"></iconify-icon>
      <span>دریافت</span>
    </button>
    <button
      class="z-10 flex w-1/2 justify-center gap-1.5 rounded-xl rounded-r-none p-1.5"
      class:text-white={value === 'WITHDRAW'}
      type="button"
      onclick={() => (value = 'WITHDRAW')}
    >
      <iconify-icon class="-rotate-90 text-sm" icon="uil:sign-out-alt"></iconify-icon>
      <span>پرداخت</span>
    </button>
  </div>
</div>
