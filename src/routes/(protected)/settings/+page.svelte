<script lang="ts">
  import { getToasterStateManager } from '$lib/components/globals/toaster/StateManager.svelte';
  import Currency from '$lib/components/inputs/Currency.svelte';
  import { currencyNumberFormatter } from '$lib/helpers';
  import { fade } from 'svelte/transition';
  import { superForm } from 'sveltekit-superforms';
  import type { PageData } from './$types';

  const ToasterStateManager = getToasterStateManager();

  const { data }: { data: PageData } = $props();

  const { enhance, form, errors } = superForm(data.form, {
    dataType: 'json',
    invalidateAll: true,
    onUpdated(event) {
      if (event.form.valid) {
        ToasterStateManager.add({
          type: 'success',
          message: 'تنظیمات با موفقیت ذخیره شد.',
          duration: 5000,
        });
      }
    },
    onSubmit({ jsonData }) {
      jsonData({
        baselineBalance: baselineBalanceStr.replaceAll(/,/g, ''),
      });
    },
  });

  const {
    enhance: passwordEnhance,
    form: passwordForm,
    errors: passwordErrors,
  } = superForm(data.passwordForm, {
    dataType: 'json',
    invalidateAll: true,
    onUpdated(event) {
      if (event.form.valid) {
        ToasterStateManager.add({
          type: 'success',
          message: 'رمز عبور با موفقیت تغییر کرد.',
          duration: 5000,
        });
      } else if (event.form.message) {
        ToasterStateManager.add({
          type: 'error',
          message: event.form.message,
          duration: 5000,
        });
      }
    },
  });

  // Convert the form value to string for the Currency component
  let baselineBalanceStr: string = $state(String($form.baselineBalance));

  $effect(() => {
    baselineBalanceStr = String($form.baselineBalance);
  });
</script>

<div
  class="flex shrink-[1] grow basis-0 flex-col gap-6 overflow-y-auto overflow-x-hidden p-1 sm:min-h-[600px]"
>
  <div class="flex flex-col gap-2">
    <h1 class="text-lg font-bold text-black">تنظیمات</h1>
    <p class="text-sm text-black/60">در این بخش می‌توانید تنظیمات کلی برنامه را مدیریت کنید.</p>
  </div>

  <form method="post" action="?/updateSettings" use:enhance class="flex flex-col gap-6">
    <div class="flex flex-col gap-4 rounded-lg bg-gray-50 p-4">
      <h2 class="text-base font-semibold text-black">موجودی پایه</h2>
      <p class="text-sm text-black/60">
        موجودی پایه، نقطه شروع محاسبات موجودی شما است. تمام تراکنش‌ها از این مقدار شروع شده و موجودی نهایی
        محاسبه می‌شود.
      </p>

      <div class="flex flex-col gap-3">
        <div class="text-sm text-black/70">
          <span class="font-medium">موجودی فعلی:</span>
          <span class="mr-2 font-bold text-accent-600">
            {currencyNumberFormatter(data.settings.baselineBalance)} تومان
          </span>
        </div>

        <div class="relative w-full max-w-sm duration-75" class:mb-3={$errors.baselineBalance}>
          <Currency name="baselineBalance" bind:value={baselineBalanceStr} label="موجودی پایه جدید" />
          {#if $errors.baselineBalance}
            <small
              class="absolute right-0 top-full translate-y-0.5 text-rose-500"
              transition:fade={{ duration: 75 }}
            >
              {$errors.baselineBalance}
            </small>
          {/if}
        </div>

        <button
          type="submit"
          class="flex w-fit items-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2 text-white duration-75 hover:bg-accent-700"
        >
          <iconify-icon class="text-lg" icon="ic:baseline-save"></iconify-icon>
          <span>ذخیره تغییرات</span>
        </button>
      </div>
    </div>
  </form>

  <div class="rounded-lg bg-blue-50 p-4">
    <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-800">
      <iconify-icon icon="ic:baseline-info"></iconify-icon>
      نکته مهم
    </h3>
    <p class="text-sm text-blue-700">
      تغییر موجودی پایه بر روی تمام محاسبات موجودی در تراکنش‌های موجود تأثیر می‌گذارد. این تغییر بلافاصله
      اعمال شده و موجودی جدید در لیست تراکنش‌ها نمایش داده می‌شود.
    </p>
  </div>

  <hr class="border-gray-200" />

  <form method="post" action="?/updatePassword" use:passwordEnhance class="flex flex-col gap-6">
    <div class="flex flex-col gap-4 rounded-lg bg-gray-50 p-4">
      <h2 class="text-base font-semibold text-black">تغییر رمز عبور</h2>
      <p class="text-sm text-black/60">
        برای افزایش امنیت، پیشنهاد می‌شود رمز عبور خود را به صورت دوره‌ای تغییر دهید.
      </p>

      <div class="flex max-w-sm flex-col gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-black/70">رمز عبور فعلی</span>
          <input
            type="password"
            name="currentPassword"
            class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            bind:value={$passwordForm.currentPassword}
          />
          {#if $passwordErrors.currentPassword}
            <small class="text-rose-500">{$passwordErrors.currentPassword}</small>
          {/if}
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-black/70">رمز عبور جدید</span>
          <input
            type="password"
            name="newPassword"
            class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            bind:value={$passwordForm.newPassword}
          />
          {#if $passwordErrors.newPassword}
            <small class="text-rose-500">{$passwordErrors.newPassword}</small>
          {/if}
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-black/70">تکرار رمز عبور جدید</span>
          <input
            type="password"
            name="confirmPassword"
            class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            bind:value={$passwordForm.confirmPassword}
          />
          {#if $passwordErrors.confirmPassword}
            <small class="text-rose-500">{$passwordErrors.confirmPassword}</small>
          {/if}
        </label>

        <button
          type="submit"
          class="mt-2 flex w-fit items-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2 text-white duration-75 hover:bg-accent-700"
        >
          <iconify-icon class="text-lg" icon="ic:baseline-lock-reset"></iconify-icon>
          <span>تغییر رمز عبور</span>
        </button>
      </div>
    </div>
  </form>
</div>
