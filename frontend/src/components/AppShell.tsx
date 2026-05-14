import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";

type AppShellProps = {
  title: string;
  description: string;
  role?: string;
  children: ReactNode;
};

export function AppShell({ title, description, role, children }: AppShellProps) {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Court Management System</p>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="text-sm font-medium text-slate-700 hover:text-blue-600" to="/">
              Dashboard
            </Link>
            <Link className="text-sm font-medium text-slate-700 hover:text-blue-600" to="/profile">
              Hồ sơ
            </Link>
            {role === "CUSTOMER" ? (
              <>
                <Link className="text-sm font-medium text-slate-700 hover:text-blue-600" to="/history">
                  Lịch sử đặt sân
                </Link>
                <Link className="text-sm font-medium text-slate-700 hover:text-blue-600" to="/bookings/new">
                  Đặt sân
                </Link>
              </>
            ) : null}
            <a
              className="text-sm font-medium text-blue-600 hover:underline"
              href="/swagger-ui/index.html"
              rel="noreferrer"
              target="_blank"
            >
              Swagger UI
            </a>
            <Button variant="outline" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
