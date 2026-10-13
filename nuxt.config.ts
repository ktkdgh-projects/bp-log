// https://nuxt.com/docs/api/configuration/nuxt-config
const CONTENT_SECURITY_POLICY = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data:`,
  `connect-src 'self'`,
  `manifest-src 'self'`,
  `object-src 'none'`,
  `worker-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ')

// 카메라·마이크·위치 같은 기기 권한은 쓰지 않으니 모두 막는다
const PERMISSIONS_POLICY = ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()', 'browsing-topics=()'].join(', ')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: 'bp-log',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '아침·저녁 혈압을 기록하고 달력과 추이로 한눈에 보는 개인 혈압 기록장' },
        { name: 'theme-color', content: '#f4f5f2' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'bp-log' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // 글꼴 CSS가 첫 화면을 막지 않게 먼저 시스템 글꼴로 그리고, 받아지면 바꾼다
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap', media: 'print', onload: 'this.media=\'all\'' },
      ],
    },
  },

  // 화면을 떠나도 받아 둔 데이터를 지우지 않는다. 다시 오면 그걸 먼저 보여 주고 뒤에서 새로 받는다 (app/utils/cache.ts)
  experimental: {
    purgeCachedData: false,
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
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
          'Permissions-Policy': PERMISSIONS_POLICY,
          'X-Frame-Options': 'DENY',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },
})
