import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      <main className="mx-auto max-w-md px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
