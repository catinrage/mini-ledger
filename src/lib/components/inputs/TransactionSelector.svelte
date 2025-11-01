<script lang="ts">
  import type { TransactionType } from '@prisma/client';

  let {
    name = 'relativeDueDateTransactionId',
    value = $bindable(''),
    label = 'تراکنش مرجع',
    transactions = [],
    currentTransactionId = undefined,
    class: className = '',
  }: {
    name?: string;
    value?: string;
    label?: string;
    transactions?: Array<{
      id: string;
      party: string;
      amount: number;
      type: TransactionType;
      dueDateResolved?: Date | null;
    }>;
    currentTransactionId?: string;
    class?: string;
  } = $props();

  // Filter out the current transaction to prevent self-reference
  const resolveDueTime = (value: Date | null | undefined) => {
    if (!value) return Number.POSITIVE_INFINITY;

    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
  };

  // Oldest due dates first; undated entries sink to the end.
  const availableTransactions = $derived(
    transactions
      .filter((t) => t.id !== currentTransactionId)
      .slice()
      .sort((a, b) => resolveDueTime(a.dueDateResolved) - resolveDueTime(b.dueDateResolved))
  );
</script>

<div class="flex flex-col gap-1 text-xs {className}">
  <label for={name} class="px-2 text-black/70">{label}</label>
  <select
    id={name}
    {name}
    bind:value
    class="rounded-lg border border-gray-300 px-3 py-2 text-black outline-none duration-150 hover:border-accent-500 focus:border-accent-600"
  >
    <option value="">-- انتخاب کنید --</option>
    {#each availableTransactions as transaction}
      <option value={transaction.id}>
        {transaction.party} -
        {transaction.amount.toLocaleString('fa-IR')} تومان
        {#if transaction.dueDateResolved}
          -
          {new Intl.DateTimeFormat('fa-IR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            calendar: 'persian',
          }).format(new Date(transaction.dueDateResolved))}
        {/if}
      </option>
    {/each}
  </select>
</div>
