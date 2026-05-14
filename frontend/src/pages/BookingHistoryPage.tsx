import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/lib/api";
import { BookingResponse, MeResponse } from "@/lib/types";

export function BookingHistoryPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [rows, setRows] = useState<BookingResponse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meResponse = await api.get<MeResponse>("/auth/me");
        setMe(meResponse.data);

        if (meResponse.data.role !== "CUSTOMER") {
          return;
        }

        const bookingsResponse = await api.get<BookingResponse[]>("/customer/bookings");
        setRows(bookingsResponse.data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Không tải được lịch sử đặt sân."));
      }
    }

    void load();
  }, []);

  return (
    <AppShell
      title="Lịch sử đặt sân"
      description="Theo dõi các booking đã tạo và trạng thái xử lý."
      role={me?.role}
    >
      {!me && !error ? <LoadingCard /> : null}
      {error ? <MessageCard title="Lỗi tải dữ liệu" description={error} /> : null}

      {me && me.role !== "CUSTOMER" ? (
        <MessageCard
          title="Chỉ dành cho khách hàng"
          description="Tài khoản hiện tại không có lịch sử booking cá nhân."
        />
      ) : null}

      {me?.role === "CUSTOMER" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Danh sách booking</CardTitle>
              <CardDescription>{rows.length} booking được tìm thấy.</CardDescription>
            </div>
            <Link to="/bookings/new">
              <Button>Tạo booking mới</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length === 0 ? (
              <p className="text-sm text-slate-500">Bạn chưa có booking nào.</p>
            ) : (
              rows.map((row) => (
                <div key={row.bookingId} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{row.courtName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Ngày {formatDate(row.bookingDate)} | {row.slotLabel}
                      </p>
                      <p className="text-sm text-slate-600">Nhân viên xử lý: {row.staffName}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge value={row.status} />
                      <p className="mt-2 text-sm text-slate-600">
                        Tổng tiền: {row.totalAmount.toLocaleString("vi-VN")} VND
                      </p>
                      <p className="text-sm text-slate-600">
                        Đặt cọc: {row.depositAmount.toLocaleString("vi-VN")} VND
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đang tải lịch sử booking...</CardTitle>
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

function StatusBadge({ value }: { value: string }) {
  const className =
    value === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : value === "CONFIRMED"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}
