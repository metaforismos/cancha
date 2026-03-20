"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => router.back()}
        className="p-2 -ml-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Volver"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="text-2xl font-bold flex-1">{title}</h1>
      {children}
    </div>
  );
}
