<script lang="ts">
  import { fly } from 'svelte/transition';

  let {
    name,
    value = $bindable(''),
    suggestions = [],
    label,
  }: { name?: string; value: string; suggestions: string[]; label: string } = $props();

  let similarStrings = $derived.by(() => {
    return suggestions.filter((suggestion) => suggestion.includes(value));
  });

  let elementFocused = $state(false);
  let expanded = $derived(similarStrings.length > 0 && elementFocused);

  let newValue = $derived(value && !suggestions.includes(value));
</script>

<div class="relative flex w-full flex-col gap-2">
  <span>{label}</span>
  <input
    class="relative z-[1] rounded-md bg-gray-100 px-4 py-1.5"
    type="text"
    autocomplete="off"
    {name}
    bind:value
    onfocus={() => {
      elementFocused = true;
    }}
    onblur={async () => {
      elementFocused = false;
    }}
  />
  {#if newValue}
    <div class="absolute left-0 top-0 text-us text-accent-600" transition:fly={{ y: 15 }}>مقدار جدید</div>
  {/if}
  {#if expanded}
    <div class="absolute left-0 top-full z-30 flex w-full flex-col rounded-md bg-white p-2 shadow-md">
      {#each similarStrings.slice(0, 10) as suggestion}
        <button
          class="rounded-md p-2 text-right duration-75 hover:bg-gray-100"
          onmousedown={() => {
            value = suggestion;
          }}>{suggestion}</button
        >
      {/each}
    </div>
  {/if}
</div>
