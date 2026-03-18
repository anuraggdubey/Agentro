"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

const FULLSCREEN_ROUTES = ["/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreenRoute = FULLSCREEN_ROUTES.includes(pathname);

  if (isFullscreenRoute) {
    return <main className="relative z-10 min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0 overflow-x-hidden">
        <Topbar />
        <main className="flex-1 p-6 lg:p-10 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
