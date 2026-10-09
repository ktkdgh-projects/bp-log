// 첫 화면은 서버가 User-Agent로 정하고, 브라우저에서는 창 너비까지 보고 다시 정한다 (plugins/device.client.ts)
export function useDevice() {
  const isMobile = useState<boolean>('device-mobile', () => {
    if (import.meta.server) return isPhoneUa(useRequestHeaders(['user-agent'])['user-agent'])
    return isPhoneUa(navigator.userAgent) || matchMedia(NARROW_QUERY).matches
  })
  return { isMobile }
}
