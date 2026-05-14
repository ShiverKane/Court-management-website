import { FormEvent, ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { RegisterResponse } from "@/lib/types";

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post<RegisterResponse>("/auth/register", {
        username,
        password,
        fullName,
        phone,
        email,
      });
      setSuccess(`Tạo tài khoản ${data.username} thành công. Bạn có thể đăng nhập ngay.`);
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setError(getApiErrorMessage(error, "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Customer Onboarding</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight">
            Tạo tài khoản để xem chi tiết sân, đặt sân và theo dõi lịch sử booking.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Sau khi đăng ký, bạn đăng nhập bằng tài khoản vừa tạo để sử dụng toàn bộ tính năng của
            khách hàng trên hệ thống.
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="font-semibold text-white">Các chức năng sau đăng ký</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <FeatureItem label="Xem chi tiết sân" />
              <FeatureItem label="Đặt sân theo khung giờ" />
              <FeatureItem label="Xem hồ sơ cá nhân" />
              <FeatureItem label="Theo dõi lịch sử booking" />
            </div>
          </div>
        </div>

        <Card className="border-slate-800 bg-white text-slate-900">
          <CardHeader>
            <CardTitle>Đăng ký tài khoản</CardTitle>
            <CardDescription>Tạo nhanh tài khoản khách hàng mới.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field label="Họ và tên">
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Username">
                <Input required value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Số điện thoại">
                <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Mật khẩu">
                <Input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
              </Button>
              <p className="text-center text-sm text-slate-600">
                Đã có tài khoản?{" "}
                <Link className="font-medium text-blue-600 hover:underline" to="/login">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">{label}</div>;
}
