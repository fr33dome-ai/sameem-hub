import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function RootPage() {
  const session = cookies().get('session')?.value;
  if (session) redirect('/overview');
  redirect('/login');
}
