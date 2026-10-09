<script setup lang="ts">
defineProps<{ ranges?: boolean }>()
</script>

<template>
  <ul class="legend" aria-label="색 안내">
    <li v-for="g in GRADES" :key="g">
      <span class="dot" :style="{ background: gradeVar(g) }" />
      {{ GRADE_LABEL[g] }}<span v-if="ranges" class="range">{{ GRADE_RANGE[g] }}</span>
    </li>
  </ul>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--sub);
}
li { display: inline-flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.range { color: var(--mute); margin-left: 2px; }
</style>
