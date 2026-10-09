// https://nuxt.com/docs/api/configuration/nuxt-config
const CONTENT_SECURITY_POLICY = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`,
  `connect-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: 'bp-log',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // 빈 값은 자리만 잡아둔 것. 실행 시 NUXT_MONGO_URI → mongoUri 식으로 환경 변수가 채운다
  runtimeConfig: {
    mongoUri: '',
    public: {},
  },

  // dev 서버의 HMR이 eval·websocket이 필요해서 운영에만 건다
  $production: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': CONTENT_SECURITY_POLICY,
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      },
    },
  },
})
