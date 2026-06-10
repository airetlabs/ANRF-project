"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (token && role === "faculty") {
      router.replace("/faculty");
    } else {
      router.replace("/login");
    }
  }, []);

  return null;
}