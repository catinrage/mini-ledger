<script lang="ts">
  import { onEsc, onOutClick, trapFocus } from '$lib/actions';
  import { fade } from 'svelte/transition';
  import { getConfirmDialogStateManager } from './StateManager.svelte';

  const ConfirmDialogStateManager = getConfirmDialogStateManager();

  const cooldown = ConfirmDialogStateManager.cooldown;
</script>

{#if ConfirmDialogStateManager.isOpen}
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/10 text-sm backdrop-blur-[5px]"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="flex flex-col gap-2 rounded-md bg-white p-5 shadow-sm"
      use:trapFocus
      use:onEsc={() => {
        ConfirmDialogStateManager.cancel();
      }}
      use:onOutClick={() => {
        ConfirmDialogStateManager.cancel();
      }}
    >
      <p class="text-sm font-bold">تایید عملیات</p>
      <span class="text-xs">{ConfirmDialogStateManager.message}</span>
      <div class="mt-2 flex gap-2 text-xs">
        <button
          class="cursor- relative overflow-hidden rounded-md bg-rose-600 px-3 py-1.5 text-white duration-75 hover:bg-rose-700"
          class:!bg-accent-600={ConfirmDialogStateManager.type === 'Normal'}
          class:hover:!bg-accent-700={ConfirmDialogStateManager.type === 'Normal'}
          class:press-effect={$cooldown === 0}
          class:cursor-not-allowed={ConfirmDialogStateManager.type === 'Danger' && $cooldown > 0}
          onclick={() => {
            ConfirmDialogStateManager.confirm();
          }}
        >
          <span>{ConfirmDialogStateManager.confirmText}</span>
          {#if ConfirmDialogStateManager.type === 'Danger'}
            <div
              class="absolute left-0 top-0 h-full w-full bg-rose-800/50"
              style:width={`${$cooldown * 100}%`}
            ></div>
          {/if}
        </button>
        <button
          class="press-effect rounded-md bg-gray-600 px-3 py-1.5 text-white duration-75 hover:bg-gray-700"
          onclick={() => {
            ConfirmDialogStateManager.cancel();
          }}>لغو</button
        >
      </div>
    </div>
  </div>
{/if}
