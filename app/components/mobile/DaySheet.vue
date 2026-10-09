<script setup lang="ts">
import type { MonthResponse } from '#shared/types'

const props = defineProps<{ date: string | null, month?: MonthResponse | null }>()
const emit = defineEmits<{ close: [], changed: [] }>()

const closeBtn = ref<HTMLButtonElement | null>(null)
watch(() => props.date, async (d) => {
  if (!d) return
  await nextTick()
  closeBtn.value?.focus()
})
</script>

<template>
  <MobileSheet :open="!!date" :label="date ? formatDate(date) : ''" @close="emit('close')">
    <DayDetail v-if="date" :date="date" :month="month" @changed="emit('changed')">
      <template #actions>
        <button ref="closeBtn" type="button" class="icon-btn" aria-label="닫기" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </template>
    </DayDetail>
  </MobileSheet>
</template>
