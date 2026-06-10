<script lang="ts">
  import AddTransactionButton from '$lib/components/AddTransactionButton.svelte';
  import Currency from '$lib/components/inputs/Currency.svelte';
  import DueDateModeSelector from '$lib/components/inputs/DueDateModeSelector.svelte';
  import PartySelector from '$lib/components/inputs/PartySelector.svelte';
  import RecurringControls from '$lib/components/inputs/RecurringControls.svelte';
  import TextArea from '$lib/components/inputs/TextArea.svelte';
  import TransactionKindSelector from '$lib/components/inputs/TransactionKindSelector.svelte';
  import TransactionTypeSelector from '$lib/components/inputs/TransactionTypeSelector.svelte';

  import { getConfirmDialogStateManager } from '$lib/components/globals/dialogs/confirm/StateManager.svelte';
  import { getToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';

  import { fade } from 'svelte/transition';
  import { superForm } from 'sveltekit-superforms';
  import type { PageData } from './$types';

  const ToasterStateManager = getToasterStateManager();
  const ConfirmDialogStateManager = getConfirmDialogStateManager();

  type DueDateMode = 'none' | 'fixed' | 'relative';
  type TransactionKind = 'single' | 'recurring';
  let transactionKind = $state<TransactionKind>('single');
  let dueDateMode = $state<DueDateMode>('fixed');
  let dueDateFixed = $state<Date>(new Date());
  let dueDateRelativeTransactionId = $state<string>('');
  let dueDateRelativeOffsetDays = $state<number>(0);
  let recurringFrequency = $state<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  let recurringInterval = $state(1);
  let recurringStartDate = $state<Date>(new Date());
  let recurringEndDateEnabled = $state(false);
  let recurringEndDate = $state<Date>(new Date());

  const { data }: { data: PageData & { initialDueDateMode?: DueDateMode } } = $props();

  const defaultDate = data.form.data?.date;
  if (defaultDate) {
    dueDateFixed = defaultDate instanceof Date ? defaultDate : new Date(defaultDate);
  }

  if (data.initialDueDateMode === 'relative' && data.form.data?.relativeDueDateTransactionId) {
    dueDateMode = 'relative';
    dueDateRelativeTransactionId = data.form.data.relativeDueDateTransactionId;
    dueDateRelativeOffsetDays = data.form.data.relativeDueDateOffsetDays ?? 0;
  } else if (defaultDate) {
    dueDateMode = 'fixed';
  }

  const { enhance, form, errors, tainted } = superForm(data.form, {
    dataType: 'json',
    invalidateAll: true,
    taintedMessage: () => {
      return ConfirmDialogStateManager.open({
        type: 'Normal',
        message: 'آیا مطمئن هستید که می‌خواهید از این صفحه خارج شوید؟',
        confirmText: 'بله',
      });
    },
    onUpdated(event) {
      if (event.form.valid) {
        ToasterStateManager.add({
          type: 'success',
          message: 'تراکنش با موفقیت ثبت شد.',
          duration: 5000,
        });
        transactionKind = 'single';
        dueDateMode = 'fixed';
        dueDateFixed = new Date();
        dueDateRelativeTransactionId = '';
        dueDateRelativeOffsetDays = 0;
        recurringFrequency = 'MONTHLY';
        recurringInterval = 1;
        recurringStartDate = new Date();
        recurringEndDateEnabled = false;
        recurringEndDate = new Date();
        $tainted = {};
      }
    },
    onSubmit({ jsonData }) {
      const isRecurring = transactionKind === 'recurring';
      jsonData({
        party: $form.party,
        amount: Number(String($form.amount).replaceAll(/,/g, '')),
        type: $form.type,
        description: $form.description,
        date: !isRecurring && dueDateMode === 'fixed' ? dueDateFixed : undefined,
        relativeDueDateTransactionId:
          !isRecurring && dueDateMode === 'relative' ? dueDateRelativeTransactionId : undefined,
        relativeDueDateOffsetDays:
          !isRecurring && dueDateMode === 'relative' ? dueDateRelativeOffsetDays : undefined,
        recurringEnabled: isRecurring,
        recurringFrequency,
        recurringInterval,
        recurringStartDate,
        recurringEndDateEnabled,
        recurringEndDate: recurringEndDateEnabled ? recurringEndDate : undefined,
      });
    },
    onResult({ result }) {
      if (result.type !== 'success' && result.status === 500) {
        ToasterStateManager.add({
          type: 'error',
          // @ts-ignore
          message: result.data?.message as string,
          duration: 5000,
        });
      }
    },
  });
</script>

<form method="post" use:enhance>
  <div class="flex flex-col gap-4">
    <TransactionKindSelector bind:value={transactionKind} />
    <div class="flex items-end gap-3 duration-75" class:mb-3={$errors.party}>
      <div class="relative w-full">
        <PartySelector name="party" bind:value={$form.party} suggestions={data.parties} label="شخص" />
        {#if $errors.party}
          <small
            class="absolute right-0 top-full translate-y-0.5 text-rose-500"
            transition:fade={{ duration: 75 }}>{$errors.party}</small
          >
        {/if}
      </div>
    </div>
    <div class="flex items-stretch gap-3 duration-75" class:mb-3={$errors.amount || $errors.type}>
      <div class="relative w-2/3">
        <Currency name="amount" bind:value={$form.amount as unknown as string} label="مقدار" />
        {#if $errors.amount}
          <small
            class="absolute right-0 top-full translate-y-0.5 text-rose-500"
            transition:fade={{ duration: 75 }}>{$errors.amount}</small
          >
        {/if}
      </div>
      <div class="relative grow">
        <TransactionTypeSelector name="type" bind:value={$form.type} label="نوع تراکنش" />
        {#if $errors.type}
          <small
            class="absolute right-0 top-full translate-y-0.5 text-rose-500"
            transition:fade={{ duration: 75 }}>{$errors.type}</small
          >
        {/if}
      </div>
    </div>
    <div class="relative duration-75" class:mb-3={$errors.description}>
      <TextArea name="description" bind:value={$form.description} label="توضیحات تراکنش" />
      {#if $errors.description}
        <small
          class="absolute right-0 top-full translate-y-0.5 text-rose-500"
          transition:fade={{ duration: 75 }}>{$errors.description}</small
        >
      {/if}
    </div>
    {#if transactionKind === 'single'}
      <div class="rounded-lg bg-gray-50 p-4">
        <DueDateModeSelector
          bind:mode={dueDateMode}
          bind:fixedDate={dueDateFixed}
          bind:relativeTransactionId={dueDateRelativeTransactionId}
          bind:relativeOffsetDays={dueDateRelativeOffsetDays}
          transactions={data.transactions}
        />
        {#if $errors.date}
          <small class="mt-2 block text-rose-500" transition:fade={{ duration: 75 }}>{$errors.date}</small>
        {/if}
      </div>
    {:else}
      <div class="rounded-lg bg-gray-50 p-4">
        <RecurringControls
          bind:frequency={recurringFrequency}
          bind:interval={recurringInterval}
          bind:startDate={recurringStartDate}
          bind:endDateEnabled={recurringEndDateEnabled}
          bind:endDate={recurringEndDate}
        />
      </div>
    {/if}
    <AddTransactionButton />
  </div>
</form>
