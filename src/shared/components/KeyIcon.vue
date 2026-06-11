<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    symbol: string;
    variant?: "default" | "inline";
  }>(),
  {
    variant: "default",
  },
);

const uid = useId().replace(/:/g, "");

const isInline = computed(() => props.variant === "inline");
const fontSize = computed(() => (isInline.value ? 11 : 16));
const height = computed(() => (isInline.value ? 23 : 33));
const padL = computed(() => (isInline.value ? 1 : 2));
const padR = computed(() => (isInline.value ? 6 : 10));

const width = computed(() => {
  const charW = Math.ceil(fontSize.value * 0.62);
  const textW = props.symbol.length * charW;
  return Math.max(textW + padL.value + padR.value, height.value);
});
</script>

<template>
  <span
    class="ga-auth-ext-key"
    :class="{
      'ga-auth-ext-key--inline': isInline,
      'ga-auth-ext-key--hidden': !symbol,
    }"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      minWidth: `${width}px`,
    }"
    aria-hidden="true"
  >
    <svg
      class="ga-auth-ext-key__svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 54 54"
      preserveAspectRatio="none"
    >
      <g transform="translate(-232,-401)">
        <path
          fill="#333333"
          d="M236.654,400.587h41.954c2.634,0,4.771,1.797,4.771,4.012v44.021c0,2.216-2.136,4.012-4.771,4.012h-41.954c-2.634,0-4.771-1.796-4.771-4.012v-44.021C231.883,402.384,234.019,400.587,236.654,400.587z"
        />
        <rect
          x="272.074"
          y="404.453"
          fill="#777777"
          width="11.279"
          height="34.563"
        />
        <linearGradient
          :id="`${uid}-g1`"
          gradientUnits="userSpaceOnUse"
          x1="-885.3761"
          y1="640.0551"
          x2="-888.4066"
          y2="652.6821"
          gradientTransform="matrix(0.2087 0 0 -0.208 461.3392 537.5479)"
        >
          <stop offset="0" stop-color="#777777" />
          <stop offset="1" stop-color="#333333" />
        </linearGradient>
        <path
          :fill="`url(#${uid}-g1)`"
          d="M274.235,407.467l9.094-2.972c-0.361-2.856-2.329-3.846-5.069-3.937c-3.646,0.105-7.203,0.26-9.094,1.337L274.235,407.467z"
        />
        <rect
          x="240.976"
          y="439.646"
          fill="#555555"
          width="33.469"
          height="12.975"
        />
        <linearGradient
          :id="`${uid}-g2`"
          gradientUnits="userSpaceOnUse"
          x1="2230.7595"
          y1="454.8979"
          x2="2250.8057"
          y2="439.2401"
          gradientTransform="matrix(-0.2087 0 0 -0.208 744.2323 537.5479)"
        >
          <stop offset="0" stop-color="#777777" />
          <stop offset="1" stop-color="#555555" />
        </linearGradient>
        <path
          :fill="`url(#${uid}-g2)`"
          d="M272.535,436.6l10.805,1.155l0.04,10.506c-0.005,2.709-2.167,4.266-4.401,4.359l-4.81-0.052l-5.324-12.345L272.535,436.6z"
        />
        <linearGradient
          :id="`${uid}-g3`"
          gradientUnits="userSpaceOnUse"
          x1="-1084.8995"
          y1="454.4057"
          x2="-1061.9962"
          y2="438.7479"
          gradientTransform="matrix(0.2087 0 0 -0.208 461.3392 537.5479)"
        >
          <stop offset="0" stop-color="#333333" />
          <stop offset="1" stop-color="#555555" />
        </linearGradient>
        <path
          :fill="`url(#${uid}-g3)`"
          d="M239.395,436.495l-7.484,1.261l-0.04,10.506c0.005,2.709,2.167,4.266,4.401,4.359l4.81-0.052l1.687-12.292L239.395,436.495z"
        />
        <path
          fill="#888888"
          d="M243.424,401.246h26.994c2.635,0,4.771,2.128,4.771,4.754v30.736c0,2.626-2.136,4.755-4.771,4.755h-26.994c-2.635,0-4.771-2.129-4.771-4.755v-30.736C238.654,403.373,240.789,401.246,243.424,401.246z"
        />
        <linearGradient
          :id="`${uid}-g4`"
          gradientUnits="userSpaceOnUse"
          x1="-1143.3112"
          y1="401.0522"
          x2="-1066.7612"
          y2="401.0522"
          gradientTransform="matrix(0.2087 0 0 -0.208 488.0692 504.7872)"
        >
          <stop offset="0" stop-color="#7A7A7A" />
          <stop offset="1" stop-color="#666666" />
        </linearGradient>
        <path
          :fill="`url(#${uid}-g4)`"
          d="M243.424,401.246h25.94c2.635,0,4.771,2.128,4.771,4.754v30.736c0,2.626-2.136,4.755-4.771,4.755h-25.94c-2.635,0-4.771-2.129-4.771-4.755v-30.736C238.654,403.373,240.789,401.246,243.424,401.246z"
        />
      </g>
    </svg>
    <span
      class="ga-auth-ext-key__label"
      :class="{ 'ga-auth-ext-key__label--inline': isInline }"
      :style="{
        marginLeft: `${padL}px`,
        marginRight: `${padR}px`,
      }"
    >
      {{ symbol }}
    </span>
  </span>
</template>
