<script lang="ts">
  import CircularCheckbox from './CircularCheckbox.svelte';
  import DateSelector from './DateSelector.svelte';

  type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  const frequencyLabels: Record<RecurrenceFrequency, string> = {
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
  };

  let {
    frequency = $bindable<RecurrenceFrequency>('MONTHLY'),
    interval = $bindable(1),
    startDate = $bindable(new Date()),
    endDateEnabled = $bindable(false),
    endDate = $bindable(new Date()),
    disabled = false,
  }: {
    frequency?: RecurrenceFrequency;
    interval?: number;
    startDate?: Date;
    endDateEnabled?: boolean;
    endDate?: Date;
    disabled?: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-4 text-xs">
  <div class="flex flex-col gap-2">
    <span class="text-black/70">نوع تکرار</span>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {#each Object.entries(frequencyLabels) as [value, label]}
        <button
          type="button"
          {disabled}
          class="rounded-lg bg-gray-100 px-3 py-1.5 text-black/70 duration-75 hover:bg-gray-200"
          class:!bg-accent-600={frequency === value}
          class:!text-white={frequency === value}
          onclick={() => (frequency = value as RecurrenceFrequency)}
        >
          {label}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid items-end gap-3 sm:grid-cols-2">
    <label class="flex w-full flex-col gap-2">
      <span class="text-black/70">
        <span>فاصله تکرار</span>
        <span class="mr-1 text-us text-black/50">(هر چند دوره یک‌بار)</span>
      </span>
      <input
        type="number"
        min="1"
        bind:value={interval}
        {disabled}
        class="w-full rounded-md bg-gray-100 px-4 py-1.5 outline-none"
      />
    </label>
    <DateSelector bind:value={startDate} label="تاریخ شروع" />
  </div>

  <div class="grid items-end gap-3 sm:grid-cols-2">
    <button
      type="button"
      {disabled}
      class="flex h-fit w-fit items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 duration-150 hover:border-accent-500"
      class:bg-accent-50={endDateEnabled}
      class:border-accent-600={endDateEnabled}
      onclick={() => (endDateEnabled = !endDateEnabled)}
    >
      <CircularCheckbox checked={endDateEnabled} />
      <span>دارای تاریخ پایان</span>
    </button>
    {#if endDateEnabled}
      <DateSelector bind:value={endDate} label="تاریخ پایان" />
    {/if}
  </div>
</div>
