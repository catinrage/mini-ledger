<script>
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { getToasterStateManager } from './StateManager.svelte';
  import Toast from './Toast.svelte';

  const ToasterStateManager = getToasterStateManager();
</script>

<div class="fixed bottom-0 right-0 z-50 flex w-full flex-col gap-2 p-5 text-sm xs:w-fit">
  {#each ToasterStateManager.toasts as toast (toast.id)}
    <div transition:fly={{ duration: 300, x: 300 }} animate:flip={{ duration: 300 }}>
      <Toast {...toast} />
    </div>
  {/each}
</div>
