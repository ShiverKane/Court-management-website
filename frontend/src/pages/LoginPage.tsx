import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MeResponse } from "@/lib/types";

type LoginResponse = MeResponse & {
  accessToken: string;
  tokenType: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
      setToken(data.accessToken);
      navigate("/", { replace: true });
    } catch (error) {
      setError(getApiErrorMessage(error, "Đăng nhập thất bại. Kiểm tra lại tài khoản mẫu."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">RBAC Demo</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight">
            Court Management với React Router, Axios, Tailwind, Spring Security, JWT và Oracle.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Hệ thống mẫu gồm 3 vai trò: Customer, Staff, Admin. Đăng nhập bằng tài khoản mock để
            xem quyền truy cập khác nhau trên dashboard.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <RoleHint title="Admin" username="admin" password="Admin@123" />
            <RoleHint title="Staff" username="staff1" password="Staff@123" />
            <RoleHint title="Customer" username="customer1" password="Customer@123" />
          </div>
        </div>

        <Card className="border-slate-800 bg-white text-slate-900">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Dùng tài khoản mock để test JWT token và RBAC.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
              <p className="text-center text-sm text-slate-600">
                Chưa có tài khoản?{" "}
                <Link className="font-medium text-blue-600 hover:underline" to="/register">
                  Đăng ký ngay
                </Link>
              </p>
              <a
                className="block text-center text-sm text-blue-600 hover:underline"
                href="/swagger-ui/index.html"
                rel="noreferrer"
                target="_blank"
              >
                Mở Swagger UI
              </a>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleHint({
  title,
  username,
  password,
}: {
  title: string;
  username: string;
  password: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">Username: {username}</p>
      <p className="text-sm text-slate-300">Password: {password}</p>
    </div>
  );
}
