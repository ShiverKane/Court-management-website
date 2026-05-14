package com.courtmanagement.backend.service;

import com.courtmanagement.backend.dto.ApiDtos.BookingResponse;
import com.courtmanagement.backend.dto.ApiDtos.CourtResponse;
import com.courtmanagement.backend.dto.ApiDtos.LeaderboardEntry;
import com.courtmanagement.backend.dto.ApiDtos.RevenueResponse;
import com.courtmanagement.backend.dto.ApiDtos.SummaryResponse;
import com.courtmanagement.backend.model.RoleName;
import com.courtmanagement.backend.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

  private final JdbcTemplate jdbcTemplate;

  public DashboardService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public SummaryResponse getSummary() {
    Long totalCourts = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM COURT", Long.class);
    Long totalBookings = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BOOKING", Long.class);
    Long todayBookings =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM BOOKING WHERE BOOKING_DATE = TRUNC(CURRENT_DATE)", Long.class);
    Long activeCustomers =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM ACCOUNT WHERE ROLE_NAME = 'CUSTOMER' AND STATUS = 'ACTIVE'",
            Long.class);
    Long serviceItems =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM SERVICE_ITEM", Long.class);

    return new SummaryResponse(
        defaultLong(totalCourts),
        defaultLong(totalBookings),
        defaultLong(todayBookings),
        defaultLong(activeCustomers),
        defaultLong(serviceItems));
  }

  public List<CourtResponse> getCourts() {
    return jdbcTemplate.query(
        """
        SELECT
          c.COURT_ID,
          c.COURT_NAME,
          ct.COURT_TYPE_NAME,
          c.SURFACE_TYPE,
          c.SPACE_TYPE,
          c.PLAYER_COUNT,
          pl.PRICE,
          c.STATUS,
          c.ADDRESS,
          NVL(ROUND(AVG(cr.SCORE), 2), 0) AS AVG_SCORE
        FROM COURT c
        JOIN COURT_TYPE ct ON ct.COURT_TYPE_ID = c.COURT_TYPE_ID
        JOIN PRICE_LIST pl ON pl.COURT_TYPE_ID = c.COURT_TYPE_ID
        LEFT JOIN COURT_RATING cr ON cr.COURT_ID = c.COURT_ID
        GROUP BY
          c.COURT_ID, c.COURT_NAME, ct.COURT_TYPE_NAME, c.SURFACE_TYPE, c.SPACE_TYPE,
          c.PLAYER_COUNT, pl.PRICE, c.STATUS, c.ADDRESS
        ORDER BY c.COURT_NAME
        """,
        (rs, rowNum) ->
            new CourtResponse(
                rs.getLong("COURT_ID"),
                rs.getString("COURT_NAME"),
                rs.getString("COURT_TYPE_NAME"),
                rs.getString("SURFACE_TYPE"),
                rs.getString("SPACE_TYPE"),
                rs.getInt("PLAYER_COUNT"),
                rs.getBigDecimal("PRICE"),
                rs.getString("STATUS"),
                rs.getString("ADDRESS"),
                rs.getBigDecimal("AVG_SCORE")));
  }

  public List<LeaderboardEntry> getLeaderboard() {
    return jdbcTemplate.query(
        """
        SELECT
          ROW_NUMBER() OVER (
            ORDER BY ROUND(AVG(cr.SCORE), 2) DESC, COUNT(*) DESC, MAX(cr.RATING_TIME) DESC
          ) AS RN,
          c.COURT_ID,
          c.COURT_NAME,
          ct.COURT_TYPE_NAME,
          ROUND(AVG(cr.SCORE), 2) AS AVG_SCORE,
          COUNT(*) AS RATING_COUNT,
          MAX(cr.RATING_TIME) AS LAST_RATING_AT
        FROM COURT c
        JOIN COURT_TYPE ct ON ct.COURT_TYPE_ID = c.COURT_TYPE_ID
        JOIN COURT_RATING cr ON cr.COURT_ID = c.COURT_ID
        GROUP BY c.COURT_ID, c.COURT_NAME, ct.COURT_TYPE_NAME
        ORDER BY AVG_SCORE DESC, RATING_COUNT DESC, LAST_RATING_AT DESC
        FETCH FIRST 5 ROWS ONLY
        """,
        (rs, rowNum) ->
            new LeaderboardEntry(
                rs.getLong("RN"),
                rs.getLong("COURT_ID"),
                rs.getString("COURT_NAME"),
                rs.getString("COURT_TYPE_NAME"),
                rs.getBigDecimal("AVG_SCORE"),
                rs.getLong("RATING_COUNT"),
                rs.getTimestamp("LAST_RATING_AT").toLocalDateTime()));
  }

  public List<BookingResponse> getCustomerBookings(AuthenticatedUser user) {
    return jdbcTemplate.query(
        """
        SELECT
          b.BOOKING_ID,
          c.COURT_NAME,
          cu.FULL_NAME AS CUSTOMER_NAME,
          NVL(e.FULL_NAME, '-') AS STAFF_NAME,
          b.BOOKING_DATE,
          b.SLOT_LABEL,
          b.STATUS,
          b.TOTAL_AMOUNT,
          b.DEPOSIT_AMOUNT
        FROM BOOKING b
        JOIN CUSTOMER cu ON cu.CUSTOMER_ID = b.CUSTOMER_ID
        JOIN COURT c ON c.COURT_ID = b.COURT_ID
        LEFT JOIN EMPLOYEE e ON e.EMPLOYEE_ID = b.EMPLOYEE_ID
        WHERE cu.ACCOUNT_ID = ?
        ORDER BY b.BOOKING_DATE DESC, b.BOOKING_ID DESC
        """,
        bookingRowMapper(),
        user.getAccountId());
  }

  public List<BookingResponse> getStaffBookings() {
    return jdbcTemplate.query(
        """
        SELECT
          b.BOOKING_ID,
          c.COURT_NAME,
          cu.FULL_NAME AS CUSTOMER_NAME,
          NVL(e.FULL_NAME, '-') AS STAFF_NAME,
          b.BOOKING_DATE,
          b.SLOT_LABEL,
          b.STATUS,
          b.TOTAL_AMOUNT,
          b.DEPOSIT_AMOUNT
        FROM BOOKING b
        JOIN CUSTOMER cu ON cu.CUSTOMER_ID = b.CUSTOMER_ID
        JOIN COURT c ON c.COURT_ID = b.COURT_ID
        LEFT JOIN EMPLOYEE e ON e.EMPLOYEE_ID = b.EMPLOYEE_ID
        WHERE b.BOOKING_DATE >= TRUNC(CURRENT_DATE)
        ORDER BY b.BOOKING_DATE ASC, b.BOOKING_ID DESC
        FETCH FIRST 8 ROWS ONLY
        """,
        bookingRowMapper());
  }

  public RevenueResponse getRevenueSummary() {
    BigDecimal totalRevenue =
        jdbcTemplate.queryForObject(
            "SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENT WHERE PAYMENT_STATUS = 'SUCCESS'",
            BigDecimal.class);
    BigDecimal totalRefund =
        jdbcTemplate.queryForObject("SELECT NVL(SUM(REFUND), 0) FROM PAYMENT", BigDecimal.class);
    Long completedPayments =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM PAYMENT WHERE PAYMENT_STATUS = 'SUCCESS'", Long.class);

    return new RevenueResponse(
        nullToZero(totalRevenue).subtract(nullToZero(totalRefund)),
        nullToZero(totalRevenue),
        defaultLong(completedPayments));
  }

  public boolean canViewStaffData(AuthenticatedUser user) {
    return user.getRoleName() == RoleName.STAFF || user.getRoleName() == RoleName.ADMIN;
  }

  public boolean canViewAdminData(AuthenticatedUser user) {
    return user.getRoleName() == RoleName.ADMIN;
  }

  private RowMapper<BookingResponse> bookingRowMapper() {
    return (rs, rowNum) -> mapBooking(rs);
  }

  private BookingResponse mapBooking(ResultSet rs) throws SQLException {
    return new BookingResponse(
        rs.getLong("BOOKING_ID"),
        rs.getString("COURT_NAME"),
        rs.getString("CUSTOMER_NAME"),
        rs.getString("STAFF_NAME"),
        rs.getDate("BOOKING_DATE").toLocalDate(),
        rs.getString("SLOT_LABEL"),
        rs.getString("STATUS"),
        rs.getBigDecimal("TOTAL_AMOUNT"),
        rs.getBigDecimal("DEPOSIT_AMOUNT"));
  }

  private long defaultLong(Long value) {
    return value == null ? 0L : value;
  }

  private BigDecimal nullToZero(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }
}
