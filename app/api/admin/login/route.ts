import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (username === 'admin' && password === '123456') {
    const res = NextResponse.json({ success: true });

    res.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      path: '/',
    });

    return res;
  }

  return NextResponse.json(
    { success: false, message: 'Login gagal' },
    { status: 401 }
  );
}