<script lang="ts">
  import '../app.css';

  import 'iconify-icon';
  import 'simplebar';
  import 'simplebar/dist/simplebar.css';
  import 'vazirmatn/Vazirmatn-font-face.css';
  // Global import usually needed

  import { setConfirmDialogStateManager } from '$lib/components/globals/dialogs/confirm/StateManager.svelte';
  import { setToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';

  import ConfirmDialog from '$lib/components/globals/dialogs/confirm/Confirm.svelte';
  import Toaster from '$lib/components/globals/toaster/Toaster.svelte';

  setToasterStateManager();
  setConfirmDialogStateManager();

  const { children } = $props();
</script>

<svelte:head>
  <title>Ledger</title>
</svelte:head>

<ConfirmDialog />
<Toaster />

{@render children()}

<style lang="postcss">
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
