<script lang="ts">
  import { getToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';
  import { superForm } from 'sveltekit-superforms';
  import type { PageData } from './$types';

  const ToasterStateManager = getToasterStateManager();

  const { data }: { data: PageData } = $props();

  const { enhance, form } = superForm(data.form, {
    dataType: 'json',
    invalidateAll: true,
    onUpdated({ form }) {
      if (!form.valid) {
        ToasterStateManager.add({
          type: 'error',
          message: form.message || 'رمز عبور وارد شده صحیح نیست',
          duration: 3000,
        });
      } else {
        ToasterStateManager.add({
          type: 'success',
          message: 'احراز هویت موفقیت‌آمیز بود',
          duration: 2000,
        });
        // Redirect is handled by the server, but ensuring client-side nav if needed
        // goto('/') // The server action redirects to / so this might be redundant or race-y.
        // Actually, if server redirects, onUpdated might be called with redirect result?
        // Let's rely on server redirect.
      }
    },
  });
</script>

<svelte:head>
  <title>احراز هویت - Ledger</title>
</svelte:head>

<main class="flex h-screen items-center justify-center bg-gradient-to-br from-accent-50 to-accent-100">
  <div class="flex w-full max-w-md flex-col gap-6 rounded-xl bg-white p-8 shadow-lg">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-2xl font-bold text-black">تایید دسترسی</h1>
      <p class="text-sm text-black/60">برای دسترسی به دفتر خود، لطفاً رمز عبور را وارد کنید</p>
    </div>

    <form method="POST" action="?/verify" use:enhance class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="passkey" class="text-sm font-medium text-black"> رمز عبور </label>
        <input
          id="passkey"
          type="password"
          name="passkey"
          bind:value={$form.passkey}
          placeholder="رمز عبور را وارد کنید"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none transition-colors duration-75 placeholder:text-black/40 focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
          required
        />
      </div>

      <button
        type="submit"
        class="flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 font-medium text-white transition-colors duration-75 hover:bg-accent-700"
      >
        <iconify-icon icon="ic:baseline-login"></iconify-icon>
        <span>ورود</span>
      </button>
    </form>
  </div>
</main>

<style lang="postcss">
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
