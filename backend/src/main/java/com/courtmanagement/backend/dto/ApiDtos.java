package com.courtmanagement.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {

  private ApiDtos() {}

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

  public record RegisterRequest(
      @NotBlank String username,
      @NotBlank String password,
      @NotBlank String fullName,
      @NotBlank String phone,
      @NotBlank String email) {}

  public record LoginResponse(
      String accessToken,
      String tokenType,
      String username,
      String displayName,
      String role) {}

  public record RegisterResponse(Long accountId, String username, String displayName, String role) {}

  public record MeResponse(Long accountId, String username, String displayName, String role) {}

  public record ProfileResponse(
      Long accountId,
      String username,
      String displayName,
      String role,
      String phone,
      String email,
      String memberLevel,
      Long points,
      String positionName) {}

  public record SummaryResponse(
      long totalCourts,
      long totalBookings,
      long todayBookings,
      long activeCustomers,
      long serviceItems) {}

  public record CourtResponse(
      Long courtId,
      String courtName,
      String courtType,
      String surfaceType,
      String spaceType,
      Integer playerCount,
      BigDecimal price,
      String status,
      String address,
      BigDecimal averageRating) {}

  public record RatingResponse(
      String customerName,
      Long score,
      String comment,
      LocalDateTime ratingTime) {}

  public record CourtDetailResponse(
      Long courtId,
      String courtName,
      String courtType,
      String surfaceType,
      String spaceType,
      Integer playerCount,
      BigDecimal price,
      String status,
      String description,
      String address,
      BigDecimal averageRating,
      Long totalRatings,
      List<RatingResponse> ratings) {}

  public record BookingCreateRequest(
      Long courtId,
      @NotBlank String bookingDate,
      @NotBlank String slotLabel) {}

  public record BookingResponse(
      Long bookingId,
      String courtName,
      String customerName,
      String staffName,
      LocalDate bookingDate,
      String slotLabel,
      String status,
      BigDecimal totalAmount,
      BigDecimal depositAmount) {}

  public record RevenueResponse(
      BigDecimal totalRevenue, BigDecimal successfulPayments, long completedPayments) {}

  public record LeaderboardEntry(
      long rank,
      Long courtId,
      String courtName,
      String courtType,
      BigDecimal averageScore,
      long ratingCount,
      LocalDateTime lastRatingAt) {}

  public record DashboardPayload(
      MeResponse me,
      SummaryResponse summary,
      List<CourtResponse> courts,
      List<LeaderboardEntry> leaderboard,
      List<BookingResponse> customerBookings,
      List<BookingResponse> staffBookings,
      RevenueResponse revenue) {}
}
