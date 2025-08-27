"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import YamlGroupBootstrap from "@/components/YamlGroupBootstrap";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <YamlGroupBootstrap />
      <AppLayout />
    </div>
  );
}

