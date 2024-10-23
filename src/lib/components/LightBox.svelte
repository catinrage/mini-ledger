<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';

  const { children, onclick }: { children: Snippet; onclick?: (event: MouseEvent) => void } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-40 flex items-center justify-center bg-black/10 text-sm backdrop-blur-[5px]"
  transition:fade={{ duration: 200 }}
  {onclick}
>
  {@render children()}
</div>
