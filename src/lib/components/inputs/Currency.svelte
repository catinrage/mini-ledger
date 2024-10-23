<script lang="ts">
  import { currencyInputFormatter } from '$lib/helpers';
  import { numberToWords } from '@persian-tools/persian-tools';

  let { name, value = $bindable('0'), label }: { name?: string; value: string; label: string } = $props();

  let rawNumber = $derived.by(() => {
    if (!value) return 0;
    return parseInt(String(value).replaceAll(/,/g, ''));
  });

  function isValueValid(value: number) {
    return !isNaN(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER && Number.isInteger(value);
  }

  let amountAsPersianString = $derived.by(() => {
    if (!isValueValid(rawNumber)) {
      return 'مقدار نا معتبر';
    }
    return numberToWords(value) + ' تومان';
  });
</script>

<div class="relative flex w-full flex-col gap-1">
  <span>
    <span>{label}</span>
    <span class="mr-1 text-us font-normal text-black/50"> (تومان)</span>
  </span>
  <div class="text-us text-black/70">
    <span>{amountAsPersianString}</span>
  </div>
  <input
    class="relative z-[1] rounded-md bg-gray-100 px-4 py-1.5"
    type="text"
    autocomplete="off"
    {name}
    bind:value
    onclick={(event) => {
      (event.target as HTMLInputElement).select();
    }}
    oninput={(e) => currencyInputFormatter(e.target as HTMLInputElement)}
  />
</div>
