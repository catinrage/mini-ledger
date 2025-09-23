<script lang="ts">
  import { onMount, untrack } from 'svelte';

  let {
    name,
    value = $bindable(new Date()),
    label,
  }: { name?: string; value: Date; label: string } = $props();

  let element: HTMLInputElement;
  let formatted = $derived(value?.toISOString().split('T')[0]);

  let randomString = Math.random().toString(36).substring(7);

  onMount(async () => {
    // @ts-expect-error no types
    const { model } = window.jQuery(element).pDatepicker({
      autoClose: true,
      timePicker: {
        enabled: false,
        second: {
          enabled: false,
        },
      },
      calendar: {
        persian: {
          locale: 'fa',
          showHint: true,
          leapYearMode: 'astronomical'
        },
        gregorian: {
          locale: 'en',
          showHint: true,
        },
      },
      navigator: {
        text: {
          btnNextText: '🠜',
          btnPrevText: '🠞',
        },
      },
      altFormat: 'DD MMMM YYYY',
      altField: `#${randomString}`,
    });
    model.options.onSelect = model.options.onHide = () => {
      untrack(() => {
        value = new Date(model.state.selected.unixDate);
      });
    };

    $effect(() => {
      value;
      untrack(() => {
        setTime(value.getTime());
      });
    });

    const setTime = (time: number) => {
      untrack(() => {
        model.api.setDate(time);
      });
    };
  });
</script>

<div class="relative flex w-full flex-col gap-2">
  <span>{label}</span>
  <input
    class="relative z-[1] w-full cursor-pointer rounded-md border border-dashed border-transparent bg-gray-100 px-4 py-1.5 text-[10px]"
    type="text"
    id={randomString}
    readonly
    onclick={() => {
      element.click();
    }}
  />
  <input
    class="invisible absolute bottom-0 left-0 w-full cursor-pointer rounded-md border border-dashed border-transparent bg-gray-100 px-4 py-1.5 text-[10px]"
    bind:this={element}
  />
  <input class="hidden" {name} type="date" value={formatted} />
</div>
