// 휴대폰 브라우저만 고른다. 태블릿(Android Mobile 없는 것, iPad)은 화면이 넓으면 데스크톱으로 본다
const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone|BlackBerry|Opera Mini|IEMobile|Mobile.+Firefox/i

// PC·태블릿이라도 창이 이보다 좁으면 모바일 화면으로 바꾼다 (데스크톱 화면은 달력·상세 두 칸이 들어갈 폭이 있어야 한다)
export const NARROW_QUERY = '(max-width: 1023px)'

export function isPhoneUa(ua: string | undefined | null): boolean {
  return !!ua && PHONE_UA.test(ua)
}
