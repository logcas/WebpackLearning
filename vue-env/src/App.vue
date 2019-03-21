<template>
  <div>
    <h1>{{msg}}</h1>
    <child></child>
  </div>
</template>

<script>
import Child from 'components/Child.vue';
export default {
  name: 'app',
  components: { Child },
  data() {
    return {
      msg: 'Hello,Vue!'
    }
  }
}
</script>
