<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createPagination, melt } from '@melt-ui/svelte';

  type Props = {
    count: number;
    perPage: number;
    defaultPage?: number;
  };

  const { count, perPage, defaultPage }: Props = $props();

  const {
    elements: { root, pageTrigger, prevButton, nextButton },
    states: { pages },
    options: { count: countSetter },
  } = createPagination({
    count,
    perPage,
    defaultPage: Math.min(defaultPage, Math.ceil(count / perPage)),
    siblingCount: 1,
    onPageChange: ({ next }) => {
      let query = new URLSearchParams($page.url.searchParams.toString());
      query.set('page', next.toString());
      goto(`?${query.toString()}`);
      return next;
    },
  });

  $effect(() => {
    countSetter.set(count);
  });
</script>

<nav class="ltr flex flex-col items-center gap-4" aria-label="pagination" use:melt={$root}>
  <div class="flex items-center gap-2">
    <button
      class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-accent-900 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-accent-900
      data-[selected]:text-white"
      use:melt={$prevButton}><iconify-icon icon="formkit:left"></iconify-icon></button
    >
    {#each $pages as page (page.key)}
      {#if page.type === 'ellipsis'}
        <span>...</span>
      {:else}
        <button
          class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-accent-900 shadow-sm
          hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-accent-900
        data-[selected]:text-white"
          use:melt={$pageTrigger(page)}>{page.value}</button
        >
      {/if}
    {/each}
    <button
      class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-accent-900 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-accent-900
    data-[selected]:text-white"
      use:melt={$nextButton}><iconify-icon icon="formkit:right"></iconify-icon></button
    >
  </div>
</nav>
