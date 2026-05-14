import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/lib/api";
import { CourtDetailResponse, MeResponse } from "@/lib/types";

export function CourtDetailPage() {
  const { courtId } = useParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [detail, setDetail] = useState<CourtDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, detailResponse] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<CourtDetailResponse>(`/public/courts/${courtId}`),
        ]);
        setMe(meResponse.data);
        setDetail(detailResponse.data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Không tải được chi tiết sân."));
      }
    }

    void load();
  }, [courtId]);

  return (
    <AppShell
      title={detail?.courtName ?? "Chi tiết sân"}
      description="Xem thông tin sân, mức giá và đánh giá gần nhất."
      role={me?.role}
    >
      {!detail && !error ? <LoadingCard /> : null}
      {error ? <MessageCard title="Không thể tải sân" description={error} /> : null}

      {detail ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>{detail.courtName}</CardTitle>
              <CardDescription>
                {detail.courtType} | {detail.surfaceType} | {detail.spaceType}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <InfoItem label="Địa chỉ" value={detail.address} />
              <InfoItem label="Trạng thái" value={detail.status} />
              <InfoItem label="Số người chơi" value={`${detail.playerCount} người`} />
              <InfoItem label="Giá hiện tại" value={`${detail.price.toLocaleString("vi-VN")} VND`} />
              <InfoItem label="Điểm trung bình" value={`${detail.averageRating} / 5`} />
              <InfoItem label="Mô tả" value={detail.description || "Chưa có mô tả"} />

              <div className="flex flex-wrap gap-3 pt-2">
                {me?.role === "CUSTOMER" ? (
                  <Link to={`/bookings/new?courtId=${detail.courtId}`}>
                    <Button>Đặt sân này</Button>
                  </Link>
                ) : null}
                <Link to="/">
                  <Button variant="outline">Quay lại dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đánh giá gần nhất</CardTitle>
              <CardDescription>{detail.totalRatings} lượt đánh giá cho sân này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.ratings.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có đánh giá nào.</p>
              ) : (
                detail.ratings.map((rating, index) => (
                  <div key={`${rating.customerName}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{rating.customerName}</p>
                      <p className="text-sm font-medium text-amber-600">{rating.score} / 5</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{rating.comment || "Không có nhận xét."}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(rating.ratingTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))
              )}
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
        <CardTitle>Đang tải chi tiết sân...</CardTitle>
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
