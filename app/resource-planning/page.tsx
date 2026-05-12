"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResourcePlanningPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/strategy"); }, []);
  return null;
}
