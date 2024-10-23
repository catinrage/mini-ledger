<script lang="ts">
  import AddTransactionButton from '$lib/components/AddTransactionButton.svelte';
  import Currency from '$lib/components/inputs/Currency.svelte';
  import DateSelector from '$lib/components/inputs/DateSelector.svelte';
  import PartySelector from '$lib/components/inputs/PartySelector.svelte';
  import TextArea from '$lib/components/inputs/TextArea.svelte';
  import TransactionTypeSelector from '$lib/components/inputs/TransactionTypeSelector.svelte';

  import { getConfirmDialogStateManager } from '$lib/components/globals/dialogs/confirm/StateManager.svelte';
  import { getToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';

  import { fade } from 'svelte/transition';
  import { superForm } from 'sveltekit-superforms';
  import type { PageData } from './$types';

  const ToasterStateManager = getToasterStateManager();
  const ConfirmDialogStateManager = getConfirmDialogStateManager();

  const { data }: { data: PageData } = $props();

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
        $form.date = new Date();
        $tainted = {};
      }
    },
    onSubmit({ jsonData }) {
      jsonData({
        party: $form.party,
        date: $form.date,
        amount: Number(String($form.amount).replaceAll(/,/g, '')),
        type: $form.type,
        description: $form.description,
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
    <div class="flex items-end gap-3 duration-75" class:mb-3={$errors.party || $errors.date}>
      <div class="relative w-1/2">
        <PartySelector name="party" bind:value={$form.party} suggestions={data.parties} label="شخص" />
        {#if $errors.party}
          <small
            class="absolute right-0 top-full translate-y-0.5 text-rose-500"
            transition:fade={{ duration: 75 }}>{$errors.party}</small
          >
        {/if}
      </div>
      <div class="relative w-1/2">
        <DateSelector name="date" bind:value={$form.date} label="تاریخ تراکنش" />
        {#if $errors.date}
          <small
            class="absolute right-0 top-full translate-y-0.5 text-rose-500"
            transition:fade={{ duration: 75 }}>{$errors.date}</small
          >
        {/if}
      </div>
    </div>
    <div class="flex items-end gap-3 duration-75" class:mb-3={$errors.amount || $errors.type}>
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
    <AddTransactionButton />
  </div>
</form>
