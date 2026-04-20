import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    console.log("🔥 Middleware Terpanggil di URL:", request.nextUrl.pathname);
    const pathname = request.nextUrl.pathname;

    // Cek apakah user memiliki cookie 'admin-auth' yang diset saat login berhasil
    const isLoggedIn = request.cookies.has('admin-auth');

    // 1. Jika user mencoba mengakses halaman di dalam /admin (selain halaman login itu sendiri)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        // Kalau belum login, tendang (redirect) ke halaman login
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 2. Jika user SUDAH login tapi malah mencoba buka halaman login lagi
    if (pathname.startsWith('/admin/login') && isLoggedIn) {
        // Lempar langsung ke halaman dashboard (orders)
        return NextResponse.redirect(new URL('/admin/orders', request.url));
    }

    // Jika aman, biarkan user lewat
    return NextResponse.next();
}

// Konfigurasi ini menyuruh Next.js untuk HANYA menjalankan middleware ini 
// di url yang berawalan /admin (menghemat performa server)
export const config = {
    matcher: ['/admin/:path*'],
};