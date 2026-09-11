import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'ar']
const defaultLocale = 'en'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    // We can use a negotiated locale here, but for simplicity, we default to 'en'
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    )
  }
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, and all files with an extension (e.g. .html, .xlsx)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
}
