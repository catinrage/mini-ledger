<script lang="ts">
  const { onclick }: { onclick?: () => void } = $props();
</script>

<div class="flex gap-3">
  <button
    class="press-effect flex items-center gap-1.5 rounded-xl bg-accent-600 px-3 py-1.5 text-white duration-75 hover:bg-accent-700"
    {onclick}
  >
    <iconify-icon class="text-lg" icon="hugeicons:filter-add"></iconify-icon>
    <span>افزودن فیلتر</span>
  </button>
</div>
