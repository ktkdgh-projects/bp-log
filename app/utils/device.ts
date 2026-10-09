// 휴대폰 브라우저만 고른다. 태블릿(Android Mobile 없는 것, iPad)은 화면이 넓으면 데스크톱으로 본다
const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone|BlackBerry|Opera Mini|IEMobile|Mobile.+Firefox/i

// PC라도 창을 이만큼 좁히면 모바일 화면으로 바꾼다
export const NARROW_QUERY = '(max-width: 767px)'

export function isPhoneUa(ua: string | undefined | null): boolean {
  return !!ua && PHONE_UA.test(ua)
}
