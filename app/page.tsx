"use client";

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to main app landing (templates page)
  redirect('/template');
}
