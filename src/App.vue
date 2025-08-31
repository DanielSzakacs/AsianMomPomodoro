<template>
  <div class="home">
    <img src="/assets/img/icon.png" alt="Asian Mom Pomodoro icon" class="home__icon" />
    <div class="home__buttons">
      <button>beallitasok</button>
      <button>strart pomodoro</button>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.home__icon {
  width: 128px;
  height: 128px;
  margin-bottom: 1rem;
}
.home__buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
