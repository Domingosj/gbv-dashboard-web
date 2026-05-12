"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportingPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/strategy"); }, []);
  return null;
}
