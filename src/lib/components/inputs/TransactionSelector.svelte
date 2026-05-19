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

  let query = $state('');
  let focused = $state(false);

  const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'persian',
  });

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
      .sort((a, b) => resolveDueTime(a.dueDateResolved) - resolveDueTime(b.dueDateResolved)),
  );

  const selectedTransaction = $derived(availableTransactions.find((transaction) => transaction.id === value));

  function formatTransactionLabel(transaction: (typeof availableTransactions)[number]) {
    const dueDate = transaction.dueDateResolved ? ` - ${dateFormatter.format(new Date(transaction.dueDateResolved))}` : '';
    return `${transaction.party} - ${transaction.amount.toLocaleString('fa-IR')} تومان${dueDate}`;
  }

  const matchingTransactions = $derived.by(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fa-IR');

    if (!normalizedQuery) {
      return availableTransactions;
    }

    return availableTransactions.filter((transaction) =>
      formatTransactionLabel(transaction).toLocaleLowerCase('fa-IR').includes(normalizedQuery),
    );
  });

  $effect(() => {
    if (!focused) {
      query = selectedTransaction ? formatTransactionLabel(selectedTransaction) : '';
    }
  });

  function handleInput(event: Event) {
    const nextQuery = (event.currentTarget as HTMLInputElement).value;

    query = nextQuery;
    focused = true;

    if (!nextQuery.trim()) {
      value = '';
    }
  }

  function selectTransaction(transaction: (typeof availableTransactions)[number]) {
    value = transaction.id;
    query = formatTransactionLabel(transaction);
    focused = false;
  }
</script>

<div class="relative flex flex-col gap-1 text-xs {className}">
  <label for={name} class="px-2 text-black/70">{label}</label>
  <input type="hidden" {name} {value} />
  <input
    id={name}
    value={query}
    autocomplete="off"
    role="combobox"
    aria-expanded={focused && matchingTransactions.length > 0}
    aria-controls={`${name}-options`}
    placeholder="جستجو یا انتخاب تراکنش مرجع"
    class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-black outline-none duration-150 hover:border-accent-500 focus:border-accent-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-accent-400 dark:focus:border-accent-400"
    oninput={handleInput}
    onfocus={() => (focused = true)}
    onblur={() => {
      window.setTimeout(() => {
        focused = false;
      }, 100);
    }}
  />
  {#if focused}
    <div
      id={`${name}-options`}
      class="absolute left-0 top-full z-40 mt-1 flex max-h-56 w-full flex-col overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-black/30"
    >
      {#if matchingTransactions.length > 0}
        {#each matchingTransactions as transaction}
          <button
            type="button"
            class="reference-transaction-option rounded-md px-3 py-2 text-right duration-75 hover:bg-gray-100 dark:hover:bg-slate-700"
            class:bg-accent-50={transaction.id === value}
            onclick={() => selectTransaction(transaction)}
            onmousedown={(event) => event.preventDefault()}
          >
            {formatTransactionLabel(transaction)}
          </button>
        {/each}
      {:else}
        <div class="px-3 py-2 text-black/50 dark:text-slate-400">تراکنشی پیدا نشد</div>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  :global(html.dark) .reference-transaction-option:hover {
    @apply !bg-slate-700;
  }
</style>
