<script setup>
import { ref } from 'vue'
import VolumeSlider from './VolumeSlider.vue'
import LoadingIcon from './LoadingIcon.vue'
</script>
<template>
  <div>
    <div v-if="track1Buffer && track2Buffer && track1Gain && track2Gain">
      <h2>Now Playing...Track {{ currentTrack }}</h2>
    </div>
    <div style="display: flex">
      <div class="track-num">Track #1</div>
      <input
        type="file"
        ref="track1"
        accept="audio/*"
        @change="handleTrackChange(1)"
      />
      <LoadingIcon v-if="loading1" />
    </div>
    <div style="display: flex">
      <div class="track-num">Track #2</div>
      <input
        type="file"
        ref="track2"
        accept="audio/*"
        @change="handleTrackChange(2)"
      />
      <LoadingIcon v-if="loading2" />
    </div>
    <div style="display: flex; flex-direction: column">
      <button @click="startTracks">Play</button>
      <button
        @click="startCrossfade"
        :disabled="track1Buffer == null || track2Buffer == null"
      >
        Start Crossfade
      </button>
    </div>
    <VolumeSlider v-model:volume="volume" />
    <br />
    <br />
    <div>
      <button @click="pauseTracks">Pause</button>
      <button @click="resumeTracks">Resume</button>
      <button @click="stopAll">Stop</button>
    </div>
    <div>
      <br />
      <input type="checkbox" id="loop" name="loop" v-model="loop" />
      <label for="loop"> Loop Tracks</label><br />
    </div>

    <label for="fadeDuration">Crossfade Duration (seconds):</label>
    <input type="range" v-model="fadeDuration" min="1" max="10" />
    <span>{{ fadeDuration }}</span> seconds
  </div>
</template>

<script>
export default {
  data() {
    return {
      fadeDuration: 5, // Default crossfade duration
      track1Buffer: null, // Audio buffer for the first track
      track2Buffer: null, // Audio buffer for the second track
      audioContext: null, // AudioContext to manage audio
      track1Source: null, // Takes audio data from the first track's buffer and plays it
      track2Source: null, // Takes audio data from the second track's buffer and plays it
      track1Gain: null, // First track volume control
      track2Gain: null, // Second track volume control
      currentTrack: 1, // 1 for track 1, 2 for track 2
      volume: ref(0.75),
      loop: false,
      loading1: false,
      loading2: false,
    }
  },
  methods: {
    // Load and decode the selected audio files
    async handleTrackChange(trackNumber) {
      const fileInput = this.$refs[`track${trackNumber}`]
      if (trackNumber === 1) {
        this.loading1 = true
      } else {
        this.loading2 = true
      }
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0]
        const fileData = await this.loadAudioFile(file)
        if (trackNumber === 1) {
          this.track1Buffer = fileData
          this.loading1 = false
        } else if (trackNumber === 2) {
          this.track2Buffer = fileData
          this.loading2 = false
        }
      }
    },
    async stopAll() {
      this.stopTrack1()
      this.stopTrack2()
    },
    async stopTrack1() {
      if (this.track1Source) this.track1Source.stop()
    },
    async stopTrack2() {
      if (this.track2Source) this.track2Source.stop()
    },
    // Helper function to load and decode an audio file
    async loadAudioFile(file) {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)()
      }
      const fileData = await file.arrayBuffer()
      return this.audioContext.decodeAudioData(fileData)
    },
    // Start the crossfade between the two tracks
    async startTracks() {
      if (!this.track1Buffer || !this.track2Buffer) {
        alert('Please upload both tracks!')
        return
      }
      if (this.track1Source || this.track2Source) {
        this.stopAll() //Stop all tracks in preparation for removal and cleanup.
        this.currentTrack = 1
      }
      this.track1Source = this.audioContext.createBufferSource()
      this.track2Source = this.audioContext.createBufferSource()
      this.track1Source.buffer = this.track1Buffer
      this.track2Source.buffer = this.track2Buffer

      this.track1Gain = this.audioContext.createGain()
      this.track2Gain = this.audioContext.createGain()

      // Set the started track to the current volume.
      this.track1Gain.value = this.volume
      console.log('Current Volume: ' + this.track1Gain.value)

      this.track1Source
        .connect(this.track1Gain)
        .connect(this.audioContext.destination)
      this.track2Source
        .connect(this.track2Gain)
        .connect(this.audioContext.destination)

      this.track1Source.start()
      this.track2Source.start()

      this.track2Gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      console.log(this.track1Source)
      console.log(this.track1Buffer)
      console.log(this.audioContext)
    },
    async startCrossfade() {
      const fadeDuration = this.fadeDuration

      if (this.currentTrack === 1) {
        this.doCrossfade(this.track1Gain, this.track2Gain, fadeDuration)
      } else {
        this.doCrossfade(this.track2Gain, this.track1Gain, fadeDuration)
      }
    },
    async doCrossfade(track1Gain, track2Gain, fadeDuration) {
      track1Gain.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
      track1Gain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + fadeDuration,
      )

      track2Gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      track2Gain.gain.linearRampToValueAtTime(
        this.volume,
        this.audioContext.currentTime + fadeDuration,
      )

      //toggle between the two tracks
      if (this.currentTrack == 1) {
        this.currentTrack = 2
      } else {
        this.currentTrack = 1
      }
    },
    changeCurrentTrackVolume() {
      if (this.track1Gain && this.track2Gain) {
        if (this.currentTrack == 1) {
          this.track1Gain.gain.value = this.volume
        } else {
          this.track2Gain.gain.value = this.volume
        }
      }
    },
    pauseTracks() {
      if (this.audioContext) this.audioContext.suspend()
    },
    resumeTracks() {
      if (this.audioContext) this.audioContext.resume()
    },
  },
  watch: {
    volume() {
      this.changeCurrentTrackVolume()
    },
    loop() {
      console.log('Loop changed to: ' + this.loop)
      this.track1Source.loop = this.loop
      this.track2Source.loop = this.loop
      console.log(this.track1Source)
    },
  },
}
</script>

<style scoped>
h1 {
  font-size: 1.5rem;
}
input[type='range'] {
  width: 100px;
}
button {
  margin-top: 10px;
}
.track-num {
  margin-right: 10px;
}
</style>
