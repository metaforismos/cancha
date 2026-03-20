import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FloatingActionProps {
  href: string;
  label: string;
}

export function FloatingAction({ href, label }: FloatingActionProps) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <Link href={href}>
          <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-base shadow-lg">
            {label}
          </Button>
        </Link>
      </div>
    </div>
  );
}
