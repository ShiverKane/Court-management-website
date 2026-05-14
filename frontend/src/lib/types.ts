export type MeResponse = {
  accountId: number;
  username: string;
  displayName: string;
  role: string;
};

export type SummaryResponse = {
  totalCourts: number;
  totalBookings: number;
  todayBookings: number;
  activeCustomers: number;
  serviceItems: number;
};

export type CourtResponse = {
  courtId: number;
  courtName: string;
  courtType: string;
  surfaceType: string;
  spaceType: string;
  playerCount: number;
  price: number;
  status: string;
  address: string;
  averageRating: number;
};

export type RatingResponse = {
  customerName: string;
  score: number;
  comment: string | null;
  ratingTime: string;
};

export type CourtDetailResponse = {
  courtId: number;
  courtName: string;
  courtType: string;
  surfaceType: string;
  spaceType: string;
  playerCount: number;
  price: number;
  status: string;
  description: string;
  address: string;
  averageRating: number;
  totalRatings: number;
  ratings: RatingResponse[];
};

export type BookingResponse = {
  bookingId: number;
  courtName: string;
  customerName: string;
  staffName: string;
  bookingDate: string;
  slotLabel: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
};

export type RevenueResponse = {
  totalRevenue: number;
  successfulPayments: number;
  completedPayments: number;
};

export type LeaderboardEntry = {
  rank: number;
  courtId: number;
  courtName: string;
  courtType: string;
  averageScore: number;
  ratingCount: number;
  lastRatingAt: string;
};

export type DashboardPayload = {
  me: MeResponse;
  summary: SummaryResponse;
  courts: CourtResponse[];
  leaderboard: LeaderboardEntry[];
  customerBookings: BookingResponse[];
  staffBookings: BookingResponse[];
  revenue: RevenueResponse | null;
};

export type ProfileResponse = {
  accountId: number;
  username: string;
  displayName: string;
  role: string;
  phone: string | null;
  email: string | null;
  memberLevel: string | null;
  points: number | null;
  positionName: string | null;
};

export type RegisterResponse = {
  accountId: number;
  username: string;
  displayName: string;
  role: string;
};
