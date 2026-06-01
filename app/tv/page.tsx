"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TVPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/carousel"); }, [router]);
  return null;
}
