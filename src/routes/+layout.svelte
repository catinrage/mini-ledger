<script lang="ts">
  import '../app.css';

  import 'iconify-icon';
  import 'simplebar';
  import 'simplebar/dist/simplebar.css';
  import 'vazirmatn/Vazirmatn-font-face.css';

  import { page } from '$app/stores';

  import { setConfirmDialogStateManager } from '$lib/components/globals/dialogs/confirm/StateManager.svelte';
  import { setToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';

  import ConfirmDialog from '$lib/components/globals/dialogs/confirm/Confirm.svelte';
  import Toaster from '$lib/components/globals/toaster/Toaster.svelte';
  import { onMount } from 'svelte';

  setToasterStateManager();
  setConfirmDialogStateManager();

  const { children } = $props();

  const view = $derived($page.url.pathname.split('/')[1]);

  onMount(async () => {
    document.addEventListener(
      'wheel',
      function (event) {
        const target = event.target as HTMLInputElement;

        // Check if the target is focused and is a number input
        if (document.activeElement !== target || target?.type !== 'number') {
          return;
        }

        // Prevent the default scroll behavior
        event.preventDefault();

        // Determine the step multiplier (5x if Ctrl is pressed, otherwise 1x)
        const stepMultiplier = event.ctrlKey ? 5 : 1;

        // Adjust the value based on the scroll direction and multiplier
        if (event.deltaY > 0) {
          for (let i = 0; i < stepMultiplier; i++) {
            target.stepDown();
          }
        } else {
          for (let i = 0; i < stepMultiplier; i++) {
            target.stepUp();
          }
        }

        target.dispatchEvent(new Event('input', { bubbles: true }));
      },
      { passive: false },
    );
  });
</script>

<svelte:head>
  <title>Ledger</title>
</svelte:head>

<ConfirmDialog />
<Toaster />

<main class="relative h-full p-6 text-black duration-100">
  <!-- <img class="fixed bottom-0 left-0" src={waves} alt="" /> -->
  <div
    class="eng fixed bottom-3 left-0 z-10 hidden w-full text-center text-xs uppercase text-black/80 sm:block"
  >
    taheri engineering group | ledger v1.0.2
  </div>

  <div class="relative z-10 flex h-full w-full flex-col items-center gap-2 sm:mt-6">
    <div class="flex w-full grow flex-col items-center gap-2 sm:w-200">
      <div class="flex w-full gap-2 rounded-md bg-white px-4 py-2 text-xs">
        <a
          class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:text-black"
          class:active={view === 'view'}
          href="view"
        >
          <iconify-icon class="text-base" icon="line-md:list-3"></iconify-icon>
          <span>لیست تراکنش ها</span>
        </a>
        <a
          class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:text-black"
          class:active={view === 'add'}
          href="add"
        >
          <iconify-icon class="text-base" icon="line-md:edit"></iconify-icon>
          <span>ثبت تراکنش جدید</span>
        </a>
        <a
          class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:text-black"
          class:active={view === 'settings'}
          href="settings"
        >
          <iconify-icon class="text-base" icon="line-md:cog"></iconify-icon>
          <span>تنظیمات</span>
        </a>
      </div>
      <div class="flex h-full w-full flex-col gap-4 rounded-md bg-white p-4 text-xs sm:h-fit">
        {@render children()}
      </div>
    </div>
  </div>
</main>

<style lang="postcss">
  .active {
    @apply bg-slate-700 text-white;
  }

  :global(*)::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
    background-color: transparent;
  }

  :global(*)::-webkit-scrollbar {
    width: 3px;
    height: 3px;
    background-color: transparent;
  }

  :global(*)::-webkit-scrollbar-thumb {
    @apply bg-accent-400;
    @apply rounded-md;
  }

  :global(.simplebar-scrollbar::before) {
    @apply bg-accent-600/20;
    width: 4px;
  }

  :global(.simplebar-track.simplebar-vertical) {
    direction: ltr;
    overflow: visible;
    left: 0;
    right: unset;
  }

  :global(.simplebar-scrollbar.simplebar-visible) {
    left: -100%;
  }
</style>
