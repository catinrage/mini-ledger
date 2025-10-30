<script lang="ts">
  let {
    checked = $bindable(false),
    onchange,
    title,
    class: className = '',
  }: {
    checked: boolean;
    onchange?: (checked: boolean) => void;
    title?: string;
    class?: string;
  } = $props();

  function handleClick() {
    checked = !checked;
    onchange?.(checked);
  }
</script>

<button
  type="button"
  onclick={handleClick}
  {title}
  class="relative flex h-5 w-5 items-center justify-center rounded-full border-2 duration-150 hover:scale-110 {className}"
  class:border-accent-600={checked}
  class:bg-accent-600={checked}
  class:border-gray-300={!checked}
  class:bg-white={!checked}
>
  {#if checked}
    <svg
      class="h-3 w-3 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
    </svg>
  {/if}
</button>
