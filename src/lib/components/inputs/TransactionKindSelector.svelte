<script lang="ts">
  type TransactionKind = 'single' | 'recurring';

  let {
    value = $bindable<TransactionKind>('single'),
    label,
  }: { value?: TransactionKind; label?: string } = $props();
</script>

<div class="relative flex w-full flex-col gap-2">
  {#if label}
    <span>{label}</span>
  {/if}
  <div class="relative z-[1] flex overflow-hidden rounded-lg bg-gray-100 text-xs">
    <div
      class="absolute left-1/2 top-0 h-full w-1/2 bg-accent-600 duration-75"
      class:!left-0={value === 'recurring'}
    ></div>
    <button
      class="z-10 flex w-1/2 items-center justify-center gap-1.5 p-2"
      class:text-white={value === 'single'}
      type="button"
      onclick={() => (value = 'single')}
    >
      <iconify-icon class="text-sm" icon="material-symbols:event-outline-rounded"></iconify-icon>
      <span>تراکنش عادی</span>
    </button>
    <button
      class="z-10 flex w-1/2 items-center justify-center gap-1.5 p-2"
      class:text-white={value === 'recurring'}
      type="button"
      onclick={() => (value = 'recurring')}
    >
      <iconify-icon class="text-sm" icon="material-symbols:event-repeat-outline-rounded"></iconify-icon>
      <span>تراکنش تکرارشونده</span>
    </button>
  </div>
</div>
