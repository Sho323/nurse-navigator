import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isLoginPage = pathname === '/login' || pathname.startsWith('/login/')
    const isAuthRoute = pathname.startsWith('/auth/')
    const isPublicRoute = isLoginPage || isAuthRoute

    // ログインしていないユーザーが保護されたページにアクセスした場合
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ログイン済みユーザーがログイン画面にアクセスした場合
    if (user && isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/nurse'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
