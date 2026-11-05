<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

// A pill that shows the current choice; the invisible native select on top opens the system picker.
const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true }, // [{ value, label }]
  label: { type: String, required: true }, // shown while nothing is picked
  allLabel: { type: String, required: true }, // the "no filter" option
})
const emit = defineEmits(['update:modelValue'])
const current = computed(() => props.options.find((o) => o.value === props.modelValue))
</script>

<template>
  <label class="fsel" :class="{ on: current }">
    <span class="fsel-text">{{ current ? current.label : label }}</span>
    <Icon name="chevron-down" :size="16" />
    <select :value="modelValue" :aria-label="label" @change="emit('update:modelValue', $event.target.value)">
      <option value="">{{ allLabel }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </label>
</template>
