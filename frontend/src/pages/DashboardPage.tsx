import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { BookingResponse, DashboardPayload } from "@/lib/types";

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get<DashboardPayload>("/dashboard");
        setData(response.data);
      } catch (error) {
        clearToken();
        setError(getApiErrorMessage(error, "Phiên đăng nhập không hợp lệ hoặc backend chưa sẵn sàng."));
      }
    }

    void load();
  }, []);

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Lỗi tải dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login", { replace: true })}>Quay lại đăng nhập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100">Đang tải dữ liệu...</div>;
  }

  const isCustomer = data.me.role === "CUSTOMER";
  const isStaff = data.me.role === "STAFF" || data.me.role === "ADMIN";
  const isAdmin = data.me.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Court Management System</p>
            <h1 className="text-2xl font-bold text-slate-900">{data.me.displayName}</h1>
            <p className="text-sm text-slate-600">
              {data.me.username} | Role: {data.me.role}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="text-sm text-blue-600 hover:underline"
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

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            title="Hồ sơ người dùng"
            description="Xem thông tin tài khoản, điểm tích lũy và quyền truy cập."
            to="/profile"
          />
          {isCustomer ? (
            <QuickAction
              title="Đặt sân mới"
              description="Chọn sân và khung giờ để tạo booking ngay."
              to="/bookings/new"
            />
          ) : null}
          {isCustomer ? (
            <QuickAction
              title="Lịch sử booking"
              description="Theo dõi các booking đã tạo và trạng thái xử lý."
              to="/history"
            />
          ) : null}
          <QuickAction
            title="Swagger API"
            description="Mở nhanh Swagger UI để test endpoint backend."
            href="/swagger-ui/index.html"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="Tổng sân" value={data.summary.totalCourts} />
          <StatCard label="Tổng booking" value={data.summary.totalBookings} />
          <StatCard label="Booking hôm nay" value={data.summary.todayBookings} />
          <StatCard label="Khách hoạt động" value={data.summary.activeCustomers} />
          <StatCard label="Dịch vụ" value={data.summary.serviceItems} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sân</CardTitle>
              <CardDescription>Dữ liệu public lấy từ backend Spring Boot + Oracle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.courts.map((court) => (
                <div
                  key={court.courtId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{court.courtName}</p>
                      <p className="text-sm text-slate-600">
                        {court.courtType} | {court.surfaceType} | {court.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">
                        {court.price.toLocaleString("vi-VN")} VND
                      </p>
                      <p className="text-sm text-slate-600">Rating: {court.averageRating}</p>
                      <Link className="text-sm font-medium text-blue-600 hover:underline" to={`/courts/${court.courtId}`}>
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BXH rating</CardTitle>
              <CardDescription>Top sân theo đánh giá khách hàng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.leaderboard.map((item) => (
                <div key={item.courtId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        #{item.rank} - {item.courtName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.courtType} | {item.ratingCount} lượt đánh giá
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-500">{item.averageScore}</p>
                      <Link className="text-sm font-medium text-blue-600 hover:underline" to={`/courts/${item.courtId}`}>
                        Chi tiết sân
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {isCustomer ? (
          <BookingCard title="Lịch sử đặt sân của tôi" rows={data.customerBookings} />
        ) : null}

        {isStaff ? (
          <BookingCard title="Booking dành cho Staff/Admin" rows={data.staffBookings} />
        ) : null}

        {isAdmin && data.revenue ? (
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Doanh thu ròng" value={`${data.revenue.totalRevenue.toLocaleString("vi-VN")} VND`} />
            <StatCard
              label="Thanh toán thành công"
              value={`${data.revenue.successfulPayments.toLocaleString("vi-VN")} VND`}
            />
            <StatCard label="Số giao dịch" value={data.revenue.completedPayments} />
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  to,
  href,
}: {
  title: string;
  description: string;
  to?: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return (
    <a href={href} rel="noreferrer" target="_blank">
      {content}
    </a>
  );
}

function BookingCard({ title, rows }: { title: string; rows: BookingResponse[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-500">Chưa có dữ liệu.</p> : null}
        {rows.map((row) => (
          <div key={row.bookingId} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{row.courtName}</p>
                <p className="text-sm text-slate-600">
                  {formatDate(row.bookingDate)} | {row.slotLabel} | {row.status}
                </p>
              </div>
              <div className="text-right text-sm text-slate-700">
                <p>Khách: {row.customerName}</p>
                <p>Staff: {row.staffName}</p>
                <p>Tổng tiền: {row.totalAmount.toLocaleString("vi-VN")} VND</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}
