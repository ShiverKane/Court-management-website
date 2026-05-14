import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/lib/api";
import { BookingResponse, CourtResponse, MeResponse } from "@/lib/types";

const SLOT_OPTIONS = ["06:00-07:30", "07:30-09:00", "17:00-18:30", "18:00-19:30", "19:30-21:00"];

export function CreateBookingPage() {
  const [searchParams] = useSearchParams();
  const initialCourtId = searchParams.get("courtId") ?? "";

  const [me, setMe] = useState<MeResponse | null>(null);
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [courtId, setCourtId] = useState(initialCourtId);
  const [bookingDate, setBookingDate] = useState(getTomorrowDate());
  const [slotLabel, setSlotLabel] = useState(SLOT_OPTIONS[3]);
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, courtsResponse] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<CourtResponse[]>("/public/courts"),
        ]);
        setMe(meResponse.data);
        setCourts(courtsResponse.data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Không tải được dữ liệu tạo booking."));
      }
    }

    void load();
  }, []);

  const selectedCourt = useMemo(
    () => courts.find((court) => String(court.courtId) === courtId) ?? null,
    [courtId, courts]
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedBooking(null);

    try {
      const response = await api.post<BookingResponse>("/customer/bookings", {
        courtId: Number(courtId),
        bookingDate,
        slotLabel,
      });
      setCreatedBooking(response.data);
    } catch (error) {
      setError(getApiErrorMessage(error, "Tạo booking thất bại."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Đặt sân mới"
      description="Chọn sân, ngày và khung giờ để tạo booking."
      role={me?.role}
    >
      {!me && !error ? <LoadingCard /> : null}
      {error ? <MessageCard title="Lỗi tạo booking" description={error} /> : null}

      {me && me.role !== "CUSTOMER" ? (
        <MessageCard
          title="Chỉ khách hàng mới có thể đặt sân"
          description="Hãy đăng nhập bằng tài khoản khách hàng để sử dụng tính năng này."
        />
      ) : null}

      {me?.role === "CUSTOMER" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Form đặt sân</CardTitle>
              <CardDescription>Booking mới sẽ được tạo ở trạng thái `PENDING`.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <Field label="Chọn sân">
                  <select
                    required
                    className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    value={courtId}
                    onChange={(e) => setCourtId(e.target.value)}
                  >
                    <option value="">Chọn sân</option>
                    {courts.map((court) => (
                      <option key={court.courtId} value={court.courtId}>
                        {court.courtName} - {court.price.toLocaleString("vi-VN")} VND
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Ngày đặt sân">
                  <input
                    required
                    className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    min={getTodayDate()}
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </Field>

                <Field label="Khung giờ">
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                    value={slotLabel}
                    onChange={(e) => setSlotLabel(e.target.value)}
                  >
                    {SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </Field>

                <Button className="w-full" disabled={loading || !courtId} type="submit">
                  {loading ? "Đang tạo booking..." : "Xác nhận đặt sân"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sân đã chọn</CardTitle>
                <CardDescription>Thông tin nhanh để kiểm tra trước khi đặt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCourt ? (
                  <>
                    <InfoItem label="Tên sân" value={selectedCourt.courtName} />
                    <InfoItem label="Loại sân" value={selectedCourt.courtType} />
                    <InfoItem label="Địa chỉ" value={selectedCourt.address} />
                    <InfoItem
                      label="Giá"
                      value={`${selectedCourt.price.toLocaleString("vi-VN")} VND`}
                    />
                    <Link to={`/courts/${selectedCourt.courtId}`}>
                      <Button className="w-full" variant="outline">
                        Xem chi tiết sân
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Chọn sân để xem thông tin chi tiết nhanh.</p>
                )}
              </CardContent>
            </Card>

            {createdBooking ? (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle>Đặt sân thành công</CardTitle>
                  <CardDescription>
                    Booking #{createdBooking.bookingId} đã được tạo với trạng thái {createdBooking.status}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-emerald-900">
                  <p>Sân: {createdBooking.courtName}</p>
                  <p>Ngày: {new Date(createdBooking.bookingDate).toLocaleDateString("vi-VN")}</p>
                  <p>Khung giờ: {createdBooking.slotLabel}</p>
                  <p>Tổng tiền: {createdBooking.totalAmount.toLocaleString("vi-VN")} VND</p>
                  <p>Tiền cọc: {createdBooking.depositAmount.toLocaleString("vi-VN")} VND</p>
                  <Link to="/history">
                    <Button className="mt-2 w-full">Xem lịch sử booking</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đang tải dữ liệu đặt sân...</CardTitle>
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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
