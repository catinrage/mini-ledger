<script lang="ts">
  import { goto } from '$app/navigation';
  import CircularCheckbox from '$lib/components/inputs/CircularCheckbox.svelte';
  import { currencyNumberFormatter } from '$lib/helpers';
  import type { TransactionType } from '@prisma/client';

  type DependencyTransaction = {
    id: string;
    party: string;
    amount: number;
    type: TransactionType;
    description?: string | null;
    relativeDueDateTransactionId?: string | null;
    relativeDueDateOffsetDays?: number | null;
    dueDateResolved?: Date | null;
  };
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
    dependencyTransactions = [],
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
    dependencyTransactions?: DependencyTransaction[];
    onEdit?: (transaction: any) => void;
  } = $props();

  let isIncluded = $state(includeInBalance);
  let showDependencies = $state(false);
  let highlightTimeout: ReturnType<typeof setTimeout> | undefined;
  let highlightedElement: HTMLElement | null = null;


  const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'persian',
  });

  function formatDueDate(value?: Date | null) {
    if (!value) return 'نامشخص';
    return dateFormatter.format(new Date(value));
  }

  function transactionLabel(transaction: DependencyTransaction) {
    const descriptionText = transaction.description?.trim();
    if (descriptionText) return descriptionText;
    const typeText = transaction.type === 'WITHDRAW' ? 'پرداخت' : 'دریافت';
    return `${typeText} ${currencyNumberFormatter(transaction.amount)} تومان - ${transaction.party}`;
  }

  function getTransactionMap() {
    return new Map(dependencyTransactions.map((transaction) => [transaction.id, transaction]));
  }

  function getChildrenByParentId() {
    const childrenByParentId = new Map<string, DependencyTransaction[]>();

    for (const transaction of dependencyTransactions) {
      if (!transaction.relativeDueDateTransactionId) continue;
      const children = childrenByParentId.get(transaction.relativeDueDateTransactionId) ?? [];
      children.push(transaction);
      childrenByParentId.set(transaction.relativeDueDateTransactionId, children);
    }

    return childrenByParentId;
  }

  function getParentRows() {
    const transactionById = getTransactionMap();
    const rows: Array<{ transaction: DependencyTransaction; depth: number }> = [];
    const visited = new Set<string>([id]);
    let parentId = relativeDueDateTransactionId ?? undefined;
    let depth = 0;

    while (parentId && !visited.has(parentId)) {
      const parent = transactionById.get(parentId);
      if (!parent) break;

      rows.push({ transaction: parent, depth });
      visited.add(parent.id);
      parentId = parent.relativeDueDateTransactionId ?? undefined;
      depth += 1;
    }

    return rows;
  }

  function getChildRows() {
    const childrenByParentId = getChildrenByParentId();
    const rows: Array<{ transaction: DependencyTransaction; depth: number }> = [];
    const visited = new Set<string>([id]);

    function visit(parentId: string, depth: number) {
      const children = childrenByParentId.get(parentId) ?? [];

      for (const child of children) {
        if (visited.has(child.id)) continue;
        rows.push({ transaction: child, depth });
        visited.add(child.id);
        visit(child.id, depth + 1);
      }
    }

    visit(id, 0);
    return rows;
  }

  function scrollToTransaction(transactionId: string) {
    if (typeof document === 'undefined') return;

    const target = document.querySelector<HTMLElement>(`[data-transaction-id="${transactionId}"]`);
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

  function getDependencySummary() {
    const parentCount = getParentRows().length;
    const childCount = getChildRows().length;

    if (parentCount && childCount) return `${parentCount} والد، ${childCount} فرزند`;
    if (parentCount) return `${parentCount} والد`;
    if (childCount) return `${childCount} فرزند`;
    return 'بدون وابستگی';
  }

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
    scrollToTransaction(relativeDueDateTransactionId);
  }

  function openRelativeTransactionCreator() {
    const params = new URLSearchParams();
    params.set('relativeDueDateTransactionId', id);
    const offset = relativeDueDateOffsetDays ?? 0;
    params.set('relativeDueDateOffsetDays', offset.toString());
    goto(`/add?${params.toString()}`);
  }
</script>

<div
  class="flex flex-col gap-2 border-b border-dashed border-black/5 p-4 duration-75 hover:bg-slate-100 dark:border-slate-700/70 dark:hover:bg-slate-800"
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
          class="flex items-center text-sm text-black/60 duration-75 hover:text-amber-600"
          onclick={openRelativeTransactionCreator}
          title="تراکنش جدید با سررسید نسبی"
        >
          <iconify-icon icon="material-symbols:add-link-rounded"></iconify-icon>
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
        class="flex flex-col gap-3 rounded-full bg-amber-50 p-3 text-us dark:bg-amber-400/10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <iconify-icon class="text-sm text-amber-600 dark:text-amber-300" icon="material-symbols:schedule"></iconify-icon>
          <span>
            {#if dueDateResolved}
              <strong>سررسید محاسبه شده:</strong>
              {new Intl.DateTimeFormat('fa-IR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                calendar: 'persian',
              }).format(new Date(dueDateResolved))}
              <span class="mr-1 text-amber-600 dark:text-amber-300">
                ({relativeDueDateOffsetDays || 0} روز {(relativeDueDateOffsetDays || 0) >= 0
                  ? 'بعد از'
                  : 'قبل از'} تراکنش مرجع)
              </span>
            {:else}
              <strong>سررسید محاسبه شده:</strong>
              <span class="text-amber-600 dark:text-amber-300">نامشخص (تراکنش مرجع سررسید ندارد)</span>
            {/if}
          </span>
        </div>
        <button
          type="button"
          class="flex items-center justify-center gap-1 rounded-lg px-3 py-0.5 text-xs font-semibold text-amber-500 duration-150 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200"
          onclick={scrollToReference}
        >
          <iconify-icon icon="material-symbols:travel-explore-outline-rounded"></iconify-icon>
          <span>نمایش تراکنش مرجع</span>
        </button>
      </div>
    {/if}


    {#if getParentRows().length || getChildRows().length}
      <div class="rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-us dark:border-sky-400/10 dark:bg-sky-400/10">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 text-sky-800 dark:text-sky-100"
          onclick={() => (showDependencies = !showDependencies)}
        >
          <span class="flex items-center gap-2 font-semibold">
            <iconify-icon icon="material-symbols:account-tree-outline-rounded"></iconify-icon>
            <span>وابستگی‌های تراکنش</span>
          </span>
          <span class="flex items-center gap-1 text-sky-600 dark:text-sky-200">
            <span>{getDependencySummary()}</span>
            <iconify-icon
              class="duration-150"
              class:rotate-180={showDependencies}
              icon="material-symbols:keyboard-arrow-down-rounded"
            ></iconify-icon>
          </span>
        </button>

        {#if showDependencies}
          <div class="mt-3 grid gap-3 lg:grid-cols-2">
            <div class="flex flex-col gap-2 rounded-md bg-white/80 p-3 dark:bg-slate-900/40">
              <div class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-100">
                <iconify-icon icon="material-symbols:arrow-upward-rounded"></iconify-icon>
                <span>والدها تا ریشه</span>
              </div>
              {#if getParentRows().length}
                <div class="flex flex-col gap-1.5">
                  {#each getParentRows() as row (row.transaction.id)}
                    <button
                      type="button"
                      class="dependency-row text-right"
                      style={`--depth: ${row.depth}`}
                      onclick={() => scrollToTransaction(row.transaction.id)}
                    >
                      <span class="dependency-branch"></span>
                      <span class="flex min-w-0 flex-col gap-1">
                        <span class="font-mono text-[10px] text-slate-500" dir="ltr">{row.transaction.id}</span>
                        <span class="truncate text-slate-700 dark:text-slate-100">{transactionLabel(row.transaction)}</span>
                        <span class="text-[10px] text-slate-500">
                          سررسید نهایی: {formatDueDate(row.transaction.dueDateResolved)} · فاصله: {row.transaction.relativeDueDateOffsetDays ?? 0} روز
                        </span>
                      </span>
                    </button>
                  {/each}
                </div>
              {:else}
                <span class="text-slate-400">والدی ثبت نشده است</span>
              {/if}
            </div>

            <div class="flex flex-col gap-2 rounded-md bg-white/80 p-3 dark:bg-slate-900/40">
              <div class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-100">
                <iconify-icon icon="material-symbols:arrow-downward-rounded"></iconify-icon>
                <span>فرزندها تا انتهای زنجیره</span>
              </div>
              {#if getChildRows().length}
                <div class="flex flex-col gap-1.5">
                  {#each getChildRows() as row (row.transaction.id)}
                    <button
                      type="button"
                      class="dependency-row text-right"
                      style={`--depth: ${row.depth}`}
                      onclick={() => scrollToTransaction(row.transaction.id)}
                    >
                      <span class="dependency-branch"></span>
                      <span class="flex min-w-0 flex-col gap-1">
                        <span class="font-mono text-[10px] text-slate-500" dir="ltr">{row.transaction.id}</span>
                        <span class="truncate text-slate-700 dark:text-slate-100">{transactionLabel(row.transaction)}</span>
                        <span class="text-[10px] text-slate-500">
                          سررسید نهایی: {formatDueDate(row.transaction.dueDateResolved)} · فاصله: {row.transaction.relativeDueDateOffsetDays ?? 0} روز
                        </span>
                      </span>
                    </button>
                  {/each}
                </div>
              {:else}
                <span class="text-slate-400">فرزندی ثبت نشده است</span>
              {/if}
            </div>
          </div>
        {/if}
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


  .dependency-row {
    --depth: 0;
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    gap: 8px;
    margin-right: calc(var(--depth) * 18px);
    border-radius: 6px;
    padding: 8px;
    color: inherit;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  .dependency-row:hover {
    background-color: rgba(14, 165, 233, 0.08);
  }

  .dependency-branch {
    min-height: 100%;
    border-right: 2px solid rgba(14, 165, 233, 0.28);
    border-bottom: 2px solid rgba(14, 165, 233, 0.28);
    border-bottom-right-radius: 6px;
  }
</style>
