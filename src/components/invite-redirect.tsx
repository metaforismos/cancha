"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function InviteRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [to, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}
