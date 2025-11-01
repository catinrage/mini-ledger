<script lang="ts">
  let { name, value = $bindable(''), label }: { name?: string; value: string; label: string } = $props();
</script>

<div class="flex w-full flex-col gap-2">
  <span>{label}</span>
  <textarea class="relative z-[1] min-h-12 rounded-md bg-gray-100 px-4 py-2" {name} bind:value></textarea>
</div>
