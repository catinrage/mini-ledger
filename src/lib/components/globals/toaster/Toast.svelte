<script lang="ts">
  import { getToasterStateManager, type Toast } from './StateManager.svelte';

  const { id, type, message, ttl }: Toast = $props();

  const ToasterStateManager = getToasterStateManager();

  function close() {
    ToasterStateManager.remove(id);
  }
</script>

<div
  class="relative flex w-full flex-col gap-1.5 overflow-hidden rounded-md border border-black/5 bg-white p-3 text-xs shadow-sm xs:w-96"
>
  <div class="flex items-center gap-2">
    {#if type === 'error'}
      <iconify-icon class="text-lg text-rose-600" icon="bxs:error"></iconify-icon>
      <span class="text-sm font-bold">خطا</span>
    {:else if type === 'success'}
      <iconify-icon class="text-lg text-teal-600" icon="ep:success-filled"></iconify-icon>
      <span class="text-sm font-bold">موفقیت آمیز</span>
    {:else if type === 'delete'}
      <iconify-icon class="text-lg text-gray-600" icon="bxs:trash"></iconify-icon>
      <span class="text-sm font-bold">حذف شد</span>
    {/if}
    <div class="mr-auto">
      <button onclick={close}>
        <iconify-icon class="text-sm text-black/50 duration-75 hover:text-black" icon="flowbite:close-outline"
        ></iconify-icon>
      </button>
    </div>
  </div>
  <p class="text-black/70">{message}</p>
  <div class="absolute bottom-0 right-0 h-0.5 w-full bg-black/5" style="width: {$ttl * 100}%;"></div>
</div>
