<script lang="ts">
  import { page } from '$app/stores';
  import waves from '$lib/assets/svg/waves.svg';
  import 'iconify-icon';
  import { onMount } from 'svelte';

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

<main class="relative h-full p-6 text-black duration-100">
  <img class="fixed bottom-0 left-0" src={waves} alt="" />
  <div class="eng fixed bottom-3 left-0 z-10 w-full text-center text-xs uppercase text-black/80 sm:block">
    hidaco | ledger v1.0.3
  </div>

  <div class="relative z-10 flex h-full w-full flex-col items-center gap-2 pb-6">
    <div class="backdrop-grayscale-lg flex h-full items-center rounded-xl bg-white/10 p-6">
      <div class="flex h-full w-full grow flex-col items-center gap-2 sm:w-200">
        <div class="flex w-full gap-2 rounded-md bg-white px-4 py-2 text-xs">
          <a
            class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:scale-105"
            class:active={view === 'view'}
            href="/view"
          >
            <iconify-icon class="text-base" icon="line-md:list-3"></iconify-icon>
            <span>لیست تراکنش ها</span>
          </a>
          <a
            class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:scale-105"
            class:active={view === 'add'}
            href="/add"
          >
            <iconify-icon class="text-base" icon="line-md:edit"></iconify-icon>
            <span>ثبت تراکنش جدید</span>
          </a>
          <a
            class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:scale-105"
            class:active={view === 'settings'}
            href="/settings"
          >
            <iconify-icon class="text-base" icon="line-md:cog"></iconify-icon>
            <span>تنظیمات</span>
          </a>
          <form method="POST" action="/login?/logout" class="ml-auto">
            <button
              type="submit"
              class="press-effect flex items-center gap-1 rounded-xl px-3 py-1.5 text-black/70 duration-75 hover:text-red-600"
            >
              <iconify-icon class="text-base" icon="line-md:logout"></iconify-icon>
              <span>خروج</span>
            </button>
          </form>
        </div>
        <div class="flex h-full w-full flex-col gap-4 rounded-md bg-white p-4 text-xs">
          {@render children()}
        </div>
      </div>
    </div>
  </div>
</main>

<style lang="postcss">
  .active {
    @apply bg-slate-700 text-white;
  }
</style>
