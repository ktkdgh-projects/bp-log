<script setup lang="ts">
import type { Grade } from '#shared/types'

const props = defineProps<{ grade: Grade, size?: 'sm' | 'md' }>()
const style = computed(() => ({ background: gradeVar(props.grade, 'bg'), color: gradeVar(props.grade, 'fg') }))
</script>

<template>
  <span class="chip" :class="size ?? 'md'" :style="style">{{ GRADE_LABEL[grade] }}</span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.chip.sm { padding: 2px 8px; font-size: 11px; }
</style>
