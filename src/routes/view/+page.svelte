<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte';
  import TransactionItem from '$lib/components/TransactionItem.svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { superForm } from 'sveltekit-superforms';
  import type { PageData } from './$types';

  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { onOutClick } from '$lib/actions';
  import AddFilterButton from '$lib/components/AddFilterButton.svelte';
  import { getConfirmDialogStateManager } from '$lib/components/globals/dialogs/confirm/StateManager.svelte';
  import { getToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';
  import Currency from '$lib/components/inputs/Currency.svelte';
  import DateSelector from '$lib/components/inputs/DateSelector.svelte';
  import PartySelector from '$lib/components/inputs/PartySelector.svelte';
  import TextArea from '$lib/components/inputs/TextArea.svelte';
  import TransactionTypeSelector from '$lib/components/inputs/TransactionTypeSelector.svelte';
  import LightBox from '$lib/components/LightBox.svelte';
  import { AmountFilter, DateFilter, DescriptionFilter, Filter, PartyFilter, TypeFilter } from '$lib/filters';
  import { currencyNumberFormatter } from '$lib/helpers';
  import { TransactionType } from '@prisma/client';
  import { fly } from 'svelte/transition';

  const ToasterStateManager = getToasterStateManager();
  const ConfirmDialogStateManager = getConfirmDialogStateManager();

  const { data }: { data: PageData } = $props();

  const { enhance } = superForm(data.form, {
    delayMs: 300,
    clearOnSubmit: 'errors',
    invalidateAll: true,
    async onSubmit({ cancel, action }) {
      if (action.search === '?/deleteTransaction') {
        const confirm = await ConfirmDialogStateManager.open({
          type: 'Danger',
          message: 'آیا مطمعنید که میخواهید این تراکنش را حذف کنید ؟',
        });
        if (!confirm) cancel();
      }
    },
    onResult(event) {
      if (event.result.type === 'success') {
        // Check the action URL to determine which action was performed
        const action = event.formEl.action;
        if (action.includes('deleteTransaction')) {
          ToasterStateManager.add({
            type: 'delete',
            message: 'تراکنش با موقیت حذف شد',
            duration: 5000,
          });
        } else if (action.includes('updateTransaction')) {
          ToasterStateManager.add({
            type: 'success',
            message: 'تراکنش با موفقیت به‌روزرسانی شد',
            duration: 5000,
          });
          view = 'none';
        }
      } else {
        ToasterStateManager.add({
          type: 'error',
          message: 'خطا در انجام عملیات',
          duration: 5000,
        });
      }
    },
  });

  let view:
    | 'none'
    | 'add-filter-amount'
    | 'add-filter-date'
    | 'add-filter-party'
    | 'add-filter-type'
    | 'add-filter-description'
    | 'edit-transaction' = $state('none');

  let showingFilterList = $state(false);

  let filters: Filter[] = $state([]);

  const filterFormValues = $state({
    amount: {
      min: '0',
      max: '0',
    },
    date: {
      min: new Date(),
      max: new Date(),
    },
    party: '',
    keywords: '',
    type: TransactionType.DEPOSIT,
  });

  const editFormValues = $state({
    id: '',
    party: '',
    amount: 0,
    type: TransactionType.DEPOSIT,
    description: '',
    date: new Date(),
  });

  page.subscribe((value) => {
    updatePages();
  });

  function updatePages() {
    setTimeout(() => {
      for (const filter of filters) {
        filter.updatePage($page);
      }
    }, 50);
  }

  function addAmountFilter(min: number, max: number) {
    if (min >= max && max !== 0) {
      ToasterStateManager.add({
        type: 'error',
        message: 'مقدار کمینه باید کوچکتر از مقدار بیشینه باشد',
        duration: 5000,
      });
      return;
    }
    const filter = new AmountFilter($page, {
      min: min === 0 ? undefined : min,
      max: max === 0 ? undefined : max,
    });
    filters = [...filters, filter];
    filter.apply();
    view = 'none';
  }
  function addDateFilter(min: Date, max: Date) {
    const filter = new DateFilter($page, {
      min: min.getTime(),
      max: max.getTime(),
    });
    filters = [...filters, filter];
    filter.apply();
    view = 'none';
  }

  function addPartyFilter(party: string) {
    const filter = new PartyFilter($page, { party });
    filters = [...filters, filter];
    filter.apply();
    view = 'none';
  }

  function addTypeFilter(type: TransactionType) {
    const filter = new TypeFilter($page, { type });
    filters = [...filters, filter];
    filter.apply();
    view = 'none';
  }

  function addDescriptionFilter(keywords: string) {
    const filter = new DescriptionFilter($page, { keywords });
    filters = [...filters, filter];
    filter.apply();
    view = 'none';
  }

  function openEditTransaction(transaction: any) {
    editFormValues.id = transaction.id;
    editFormValues.party = transaction.party;
    editFormValues.amount = transaction.amount.toString();
    editFormValues.type = transaction.type;
    editFormValues.description = transaction.description;
    editFormValues.date = new Date(transaction.date);
    view = 'edit-transaction';
  }

  function updateTransaction() {
    // This will be handled by the form submission
    view = 'none';
  }

  if (browser) {
    const party = $page.url.searchParams.get('party');
    const minDate = Number($page.url.searchParams.get('minDate'));
    const maxDate = Number($page.url.searchParams.get('maxDate'));
    const minAmount = Number($page.url.searchParams.get('minAmount') ?? '0');
    const maxAmount = Number($page.url.searchParams.get('maxAmount') ?? '0');
    const type = $page.url.searchParams.get('type') as TransactionType | undefined;
    const keywords = $page.url.searchParams.get('keywords');

    if (party) {
      addPartyFilter(party);
    }
    if (minDate && maxDate) {
      addDateFilter(new Date(minDate), new Date(maxDate));
    }
    if (minAmount || maxAmount) {
      addAmountFilter(minAmount, maxAmount);
    }
    if (type) {
      addTypeFilter(type);
    }
    if (keywords) {
      addDescriptionFilter(keywords);
    }
  }
</script>

<div class="flex flex-wrap gap-2 text-us" use:autoAnimate>
  {#each filters as filter}
    <button
      class="group flex items-center gap-1.5 rounded-2xl bg-accent-600 px-2 py-1 text-white"
      onclick={() => {
        filter.remove();
        filters = filters.filter((f) => f !== filter);
      }}
    >
      <iconify-icon
        class="text-sm text-white/60 duration-75 group-hover:text-white"
        icon="carbon:close-filled"
      ></iconify-icon>
      <span class="text-nowrap">{filter.toString()}</span>
    </button>
  {/each}
  <div
    class="relative flex gap-2"
    use:onOutClick={() => {
      showingFilterList = false;
    }}
  >
    <button
      class="group flex items-center gap-1.5 text-nowrap rounded-2xl bg-accent-800 px-2 py-1 text-white"
      onclick={() => {
        showingFilterList = true;
      }}
    >
      <iconify-icon
        class="rotate-45 text-sm text-white/60 duration-75 group-hover:text-white"
        icon="carbon:close-filled"
      ></iconify-icon>
      <span>فیلتر جدید</span>
    </button>
    <button
      class="group flex items-center gap-1.5 rounded-2xl bg-rose-800 px-2 py-1 text-white"
      onclick={() => {
        filters.forEach((filter) => filter.remove());
        filters = [];
      }}
    >
      <iconify-icon class=" text-sm text-white/60 duration-75 group-hover:text-white" icon="tabler:filter-off"
      ></iconify-icon>
    </button>
    {#if showingFilterList}
      <div
        class="absolute right-0 top-full z-10 flex w-fit translate-y-2 flex-col gap-2 rounded-md bg-white p-2 shadow-lg"
        transition:fly={{ y: -30 }}
      >
        {#if !filters.some((filter) => filter instanceof AmountFilter)}
          <button
            class="text-nowrap px-2 text-right text-black/70 duration-75 hover:text-black"
            onmousedown={() => {
              view = 'add-filter-amount';
              showingFilterList = false;
            }}>فیلتر مقدار</button
          >
        {/if}
        {#if !filters.some((filter) => filter instanceof DateFilter)}
          <button
            class="text-nowrap px-2 text-right text-black/70 duration-75 hover:text-black"
            onmousedown={() => {
              view = 'add-filter-date';
              showingFilterList = false;
            }}>فیلتر تاریخ</button
          >
        {/if}
        {#if !filters.some((filter) => filter instanceof PartyFilter)}
          <button
            class="text-nowrap px-2 text-right text-black/70 duration-75 hover:text-black"
            onmousedown={() => {
              view = 'add-filter-party';
              showingFilterList = false;
            }}>فیلتر شخص</button
          >
        {/if}
        {#if !filters.some((filter) => filter instanceof TypeFilter)}
          <button
            class="text-nowrap px-2 text-right text-black/70 duration-75 hover:text-black"
            onmousedown={() => {
              view = 'add-filter-type';
              showingFilterList = false;
            }}>فیلتر نوع تراکنش</button
          >
        {/if}
        {#if !filters.some((filter) => filter instanceof DescriptionFilter)}
          <button
            class="text-nowrap px-2 text-right text-black/70 duration-75 hover:text-black"
            onmousedown={() => {
              view = 'add-filter-description';
              showingFilterList = false;
            }}>فیلتر کلیدواژه</button
          >
        {/if}
      </div>
    {/if}
  </div>
</div>
<div class="flex flex-wrap divide-x divide-x-reverse gap-y-2">
  <span class="px-2"
    >تعداد کل تراکنش ها : <strong class="text-accent-600">{data.totalNumberOfTransactions}</strong></span
  >
  <span class="px-2">
    تعداد تراکتش ها با توجه به فیلتر ها : <strong class="text-accent-600">{data.numberOfTransactions}</strong
    ></span
  >
  <span class="px-2">
    موجودی پایه : <strong class="text-indigo-600">{currencyNumberFormatter(data.baselineBalance)} تومان</strong
    ></span
  >

</div>
<div
  class="flex shrink-[1] grow basis-0 flex-col divide-y divide-dashed divide-black/10 overflow-y-auto overflow-x-hidden sm:min-h-[600px]"
>
  <div class="flex px-4 py-2 font-bold">
    <div class="w-1/4">شخص</div>
    <div class="w-1/6">
      <span>مقدار</span><span class="mr-1 text-us font-normal text-black/50"> (تومان)</span>
    </div>
    <div class="w-1/6">نوع</div>
    <div class="w-1/6">تاریخ</div>
    <div class="w-1/6">
      <span>تراز</span><span class="mr-1 text-us font-normal text-black/50"> (تومان)</span>
    </div>
    <div class="w-1/12">عملیات</div>
  </div>
  <div class="flex flex-col gap-2">
    <form method="post" use:enhance use:autoAnimate>
      {#each data.transactions as transaction (transaction.id)}
        <TransactionItem {...transaction} onEdit={openEditTransaction} />
      {:else}
        <div class="flex items-center p-3 text-sm">
          <p class="text-black/50">تراکنشی یافت نشد</p>
        </div>
      {/each}
    </form>
  </div>
</div>

<Pagination
  count={data.numberOfTransactions}
  perPage={data.TRANSACTION_PER_PAGE}
  defaultPage={data.currentPage}
/>

<!-- Amount Filter -->
{#if view === 'add-filter-amount'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="text-us text-black/50">اگر مقدار را برار با 0 قرار دهید فیلتر مورد نظر اعمال نخواهد شد</div>
      <div class="relative w-72">
        <Currency label="از مقدار" bind:value={filterFormValues.amount.min} />
      </div>
      <div class="relative w-72">
        <Currency label="تا مقدار" bind:value={filterFormValues.amount.max} />
      </div>
      <AddFilterButton
        onclick={() => {
          addAmountFilter(
            Number(String(filterFormValues.amount.min).replaceAll(/,/g, '')),
            Number(String(filterFormValues.amount.max).replaceAll(/,/g, '')),
          );
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Amount Filter -->
{#if view === 'add-filter-amount'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="text-us text-black/50">اگر مقدار را برار با 0 قرار دهید فیلتر مورد نظر اعمال نخواهد شد</div>
      <div class="relative w-72">
        <Currency label="از مقدار" bind:value={filterFormValues.amount.min} />
      </div>
      <div class="relative w-72">
        <Currency label="تا مقدار" bind:value={filterFormValues.amount.max} />
      </div>
      <AddFilterButton
        onclick={() => {
          addAmountFilter(
            Number(String(filterFormValues.amount.min).replaceAll(/,/g, '')),
            Number(String(filterFormValues.amount.max).replaceAll(/,/g, '')),
          );
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Date Filter -->
{#if view === 'add-filter-date'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="relative w-72">
        <DateSelector label="از تاریخ" bind:value={filterFormValues.date.min} />
      </div>
      <div class="relative w-72">
        <DateSelector label="تا تاریخ" bind:value={filterFormValues.date.max} />
      </div>
      <AddFilterButton
        onclick={() => {
          addDateFilter(filterFormValues.date.min, filterFormValues.date.max);
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Party Filter -->
{#if view === 'add-filter-party'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="relative w-72">
        <PartySelector label="شخص" bind:value={filterFormValues.party} suggestions={data.parties} />
      </div>
      <AddFilterButton
        onclick={() => {
          addPartyFilter(filterFormValues.party);
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Type Filter -->
{#if view === 'add-filter-type'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="relative w-72">
        <TransactionTypeSelector label="نوع تراکنش" bind:value={filterFormValues.type} />
      </div>
      <AddFilterButton
        onclick={() => {
          addTypeFilter(filterFormValues.type);
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Description Filter -->
{#if view === 'add-filter-description'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <div class="relative w-72">
        <TextArea label="کلید واژه ها" bind:value={filterFormValues.keywords} />
      </div>
      <AddFilterButton
        onclick={() => {
          addDescriptionFilter(filterFormValues.keywords);
        }}
      />
    </div>
  </LightBox>
{/if}

<!-- Edit Transaction -->
{#if view === 'edit-transaction'}
  <LightBox
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        view = 'none';
      }
    }}
  >
    <div class="flex flex-col gap-5 rounded-xl bg-white p-5 text-xs">
      <h3 class="text-base font-bold text-black">ویرایش تراکنش</h3>
      <form method="post" action="?/updateTransaction" use:enhance class="flex flex-col gap-5">
        <input type="hidden" name="id" value={editFormValues.id} />
        
        <div class="relative w-72">
          <PartySelector name="party" label="شخص" bind:value={editFormValues.party} suggestions={data.parties} />
        </div>
        
        <div class="relative w-72">
          <Currency name="amount" label="مقدار" bind:value={editFormValues.amount as unknown as string} />
        </div>
        
        <div class="relative w-72">
          <TransactionTypeSelector name="type" label="نوع تراکنش" bind:value={editFormValues.type} />
        </div>
        
        <div class="relative w-72">
          <DateSelector name="date" label="تاریخ تراکنش" bind:value={editFormValues.date} />
        </div>
        
        <div class="relative w-72">
          <TextArea name="description" label="توضیحات تراکنش" bind:value={editFormValues.description} />
        </div>
        
        <div class="flex gap-3">
          <button
            type="submit"
            class="flex items-center gap-1.5 rounded-xl bg-accent-600 px-3 py-1.5 text-white duration-75 hover:bg-accent-700"
          >
            <iconify-icon class="text-lg" icon="ic:baseline-save"></iconify-icon>
            <span>ذخیره تغییرات</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-gray-600 px-3 py-1.5 text-white duration-75 hover:bg-gray-700"
            onclick={() => view = 'none'}
          >
            <iconify-icon class="text-lg" icon="ic:baseline-cancel"></iconify-icon>
            <span>لغو</span>
          </button>
        </div>
      </form>
    </div>
  </LightBox>
{/if}
