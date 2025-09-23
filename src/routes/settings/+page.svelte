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

  // Convert the form value to string for the Currency component
  let baselineBalanceStr: string = $state(String($form.baselineBalance));
  
  $effect(() => {
    baselineBalanceStr = String($form.baselineBalance);
  });
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-2">
    <h1 class="text-lg font-bold text-black">تنظیمات</h1>
    <p class="text-sm text-black/60">
      در این بخش می‌توانید تنظیمات کلی برنامه را مدیریت کنید.
    </p>
  </div>

  <form method="post" action="?/updateSettings" use:enhance class="flex flex-col gap-6">
    <div class="flex flex-col gap-4 rounded-lg bg-gray-50 p-4">
      <h2 class="text-base font-semibold text-black">موجودی پایه</h2>
      <p class="text-sm text-black/60">
        موجودی پایه، نقطه شروع محاسبات موجودی شما است. تمام تراکنش‌ها از این مقدار شروع شده و موجودی نهایی محاسبه می‌شود.
      </p>
      
      <div class="flex flex-col gap-3">
        <div class="text-sm text-black/70">
          <span class="font-medium">موجودی فعلی:</span>
          <span class="mr-2 font-bold text-accent-600">
            {currencyNumberFormatter(data.settings.baselineBalance)} تومان
          </span>
        </div>
        
        <div class="relative w-full max-w-sm duration-75" class:mb-3={$errors.baselineBalance}>
          <Currency 
            name="baselineBalance" 
            bind:value={baselineBalanceStr} 
            label="موجودی پایه جدید" 
          />
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
      تغییر موجودی پایه بر روی تمام محاسبات موجودی در تراکنش‌های موجود تأثیر می‌گذارد. 
      این تغییر بلافاصله اعمال شده و موجودی جدید در لیست تراکنش‌ها نمایش داده می‌شود.
    </p>
  </div>
</div>