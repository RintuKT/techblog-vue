<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import {
  AndroidIcon,
  AppleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  ChartIncreaseIcon,
  FileVideoIcon,
  GithubIcon,
  Globe02Icon,
  GridViewIcon,
  IdentityCardIcon,
  Moon02Icon,
  News01Icon,
  PlayStoreIcon,
  Rocket01Icon,
  Search01Icon,
  Sun03Icon,
  UserGroupIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'

// Every icon on the site comes from Hugeicons (free stroke-rounded set), picked by a short name.
const icons = {
  sun: Sun03Icon,
  moon: Moon02Icon,
  search: Search01Icon,
  close: Cancel01Icon,
  'chevron-down': ArrowDown01Icon,
  'chevron-left': ArrowLeft01Icon,
  'chevron-right': ArrowRight01Icon,
  'arrow-left': ArrowLeft02Icon,
  'arrow-right': ArrowRight02Icon,
  external: ArrowUpRight01Icon,
  stories: News01Icon,
  releases: Rocket01Icon,
  writers: UserGroupIcon,
  apple: AppleIcon,
  'play-store': PlayStoreIcon,
  github: GithubIcon,
  // product icons, referenced by `icon:` in content/products.yaml
  grid: GridViewIcon,
  globe: Globe02Icon,
  android: AndroidIcon,
  'id-card': IdentityCardIcon,
  chart: ChartIncreaseIcon,
  'video-file': FileVideoIcon,
  video: Video01Icon,
}

defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: Number, default: undefined },
})
</script>

<template>
  <HugeiconsIcon v-if="icons[name]" class="icon" :icon="icons[name]" :size="size" :stroke-width="strokeWidth" aria-hidden="true" />
</template>
