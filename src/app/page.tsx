import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/brands'); // Default to brands view as dashboard overview or just landing
}
