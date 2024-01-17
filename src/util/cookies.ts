export function getCookieValueByName(cookies: string | string[], cookieName: string) {

  let cookiesArray = typeof cookies === 'string' ? [cookies] : cookies
  const cookie = cookiesArray.find(cookie => cookie.split('=')[0] === cookieName)
  if (cookie) return cookie.split('=').slice(1).join('=')
  return null; // Return null if the cookie with the specified name is not found
}

export function getCookieStringByName(cookies, cookieName) {
  
  let cookiesArray = typeof cookies === 'string' ? [cookies] : cookies
  const cookie = cookiesArray.find(cookie => cookie.split('=')[0] === cookieName)
  if (cookie) return cookie
  return null; // Return null if the cookie with the specified name is not found
}