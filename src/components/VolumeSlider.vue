<template>
  <div>
    <label for="volume">Volume:</label>
    <input
      type="range"
      v-model="volume"
      min="0"
      max="1"
      step="0.01"
      @input="updateVolume"
    />
    <span>{{ volume }}</span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      volume: 0.75,
    }
  },
  methods: {
    updateVolume() {
      this.$emit('update:volume', this.volume)
    },
  },
}
</script>

<style scoped></style>
