<script setup lang="ts">
import BaseToastContainer from './components/ui/BaseToastContainer.vue';
</script>

<template>
  <router-view />
  <BaseToastContainer />
</template>

<style>
/* Global styles or resets can go here */
body {
  margin: 0;
  background-color: #0b0f19;
}
</style>
