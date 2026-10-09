// 서버가 그린 화면과 맞춘 뒤(hydration 이후)에 창 너비를 반영한다
export default defineNuxtPlugin((nuxtApp) => {
  const { isMobile } = useDevice()
  const phone = isPhoneUa(navigator.userAgent)
  const narrow = matchMedia(NARROW_QUERY)
  const apply = () => {
    isMobile.value = phone || narrow.matches
  }
  nuxtApp.hook('app:suspense:resolve', apply)
  narrow.addEventListener('change', apply)
})
