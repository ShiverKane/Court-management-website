import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/lib/api";
import { ProfileResponse } from "@/lib/types";

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get<ProfileResponse>("/auth/profile");
        setProfile(response.data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Không tải được hồ sơ người dùng."));
      }
    }

    void load();
  }, []);

  return (
    <AppShell
      title="Hồ sơ người dùng"
      description="Thông tin tài khoản và hồ sơ cá nhân hiện tại."
      role={profile?.role}
    >
      {!profile && !error ? <LoadingCard /> : null}
      {error ? <MessageCard title="Lỗi tải hồ sơ" description={error} /> : null}

      {profile ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{profile.displayName}</CardTitle>
              <CardDescription>
                {profile.username} | {profile.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Số điện thoại" value={profile.phone ?? "Chưa cập nhật"} />
              <InfoItem label="Email" value={profile.email ?? "Chưa cập nhật"} />
              <InfoItem label="Hạng thành viên" value={profile.memberLevel ?? "Không áp dụng"} />
              <InfoItem
                label="Điểm tích lũy"
                value={profile.points != null ? profile.points.toLocaleString("vi-VN") : "0"}
              />
              <InfoItem label="Vị trí nhân sự" value={profile.positionName ?? "Không áp dụng"} />
              <InfoItem label="Mã tài khoản" value={`#${profile.accountId}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt quyền truy cập</CardTitle>
              <CardDescription>Chức năng hiển thị theo vai trò hiện tại.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <RoleCapability
                enabled={profile.role === "CUSTOMER"}
                title="Khách hàng"
                description="Đặt sân mới, xem lịch sử booking, xem chi tiết sân."
              />
              <RoleCapability
                enabled={profile.role === "STAFF" || profile.role === "ADMIN"}
                title="Nhân viên"
                description="Theo dõi booking sắp tới trên dashboard."
              />
              <RoleCapability
                enabled={profile.role === "ADMIN"}
                title="Quản trị viên"
                description="Xem thêm khối doanh thu và dữ liệu tổng quan."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đang tải hồ sơ...</CardTitle>
      </CardHeader>
    </Card>
  );
}

function MessageCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RoleCapability({
  enabled,
  title,
  description,
}: {
  enabled: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-slate-600">{description}</p>
    </div>
  );
}
