package com.courtmanagement.backend.service;

import com.courtmanagement.backend.dto.ApiDtos.BookingCreateRequest;
import com.courtmanagement.backend.dto.ApiDtos.BookingResponse;
import com.courtmanagement.backend.dto.ApiDtos.CourtDetailResponse;
import com.courtmanagement.backend.dto.ApiDtos.ProfileResponse;
import com.courtmanagement.backend.dto.ApiDtos.RatingResponse;
import com.courtmanagement.backend.dto.ApiDtos.RegisterRequest;
import com.courtmanagement.backend.dto.ApiDtos.RegisterResponse;
import com.courtmanagement.backend.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerFeatureService {

  private final JdbcTemplate jdbcTemplate;
  private final PasswordEncoder passwordEncoder;

  public CustomerFeatureService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
    this.jdbcTemplate = jdbcTemplate;
    this.passwordEncoder = passwordEncoder;
  }

  public RegisterResponse register(RegisterRequest request) {
    Long existing =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM ACCOUNT WHERE USERNAME = ?",
            Long.class,
            request.username().trim());
    if (existing != null && existing > 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username đã tồn tại.");
    }

    jdbcTemplate.update(
        """
        INSERT INTO ACCOUNT (USERNAME, PASSWORD_HASH, ROLE_NAME, DISPLAY_NAME, STATUS)
        VALUES (?, ?, 'CUSTOMER', ?, 'ACTIVE')
        """,
        request.username().trim(),
        passwordEncoder.encode(request.password()),
        request.fullName().trim());

    Long accountId =
        jdbcTemplate.queryForObject(
            "SELECT ACCOUNT_ID FROM ACCOUNT WHERE USERNAME = ?",
            Long.class,
            request.username().trim());
    if (accountId == null) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được tài khoản.");
    }

    jdbcTemplate.update(
        """
        INSERT INTO CUSTOMER (ACCOUNT_ID, FULL_NAME, PHONE, EMAIL, MEMBER_LEVEL, POINTS)
        VALUES (?, ?, ?, ?, 'Bronze', 0)
        """,
        accountId,
        request.fullName().trim(),
        request.phone().trim(),
        request.email().trim());

    return new RegisterResponse(accountId, request.username().trim(), request.fullName().trim(), "CUSTOMER");
  }

  public ProfileResponse getProfile(AuthenticatedUser user) {
    return jdbcTemplate.queryForObject(
        """
        SELECT
          a.ACCOUNT_ID,
          a.USERNAME,
          a.DISPLAY_NAME,
          a.ROLE_NAME,
          c.PHONE,
          c.EMAIL,
          c.MEMBER_LEVEL,
          c.POINTS,
          e.POSITION_NAME
        FROM ACCOUNT a
        LEFT JOIN CUSTOMER c ON c.ACCOUNT_ID = a.ACCOUNT_ID
        LEFT JOIN EMPLOYEE e ON e.ACCOUNT_ID = a.ACCOUNT_ID
        WHERE a.ACCOUNT_ID = ?
        """,
        (rs, rowNum) -> mapProfile(rs),
        user.getAccountId());
  }

  public CourtDetailResponse getCourtDetail(Long courtId) {
    CourtDetailResponse detail =
        jdbcTemplate.query(
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
              c.DESCRIPTION,
              c.ADDRESS,
              NVL(ROUND(AVG(cr.SCORE), 2), 0) AS AVG_SCORE,
              COUNT(cr.RATING_ID) AS TOTAL_RATINGS
            FROM COURT c
            JOIN COURT_TYPE ct ON ct.COURT_TYPE_ID = c.COURT_TYPE_ID
            JOIN PRICE_LIST pl ON pl.COURT_TYPE_ID = c.COURT_TYPE_ID
            LEFT JOIN COURT_RATING cr ON cr.COURT_ID = c.COURT_ID
            WHERE c.COURT_ID = ?
            GROUP BY
              c.COURT_ID, c.COURT_NAME, ct.COURT_TYPE_NAME, c.SURFACE_TYPE, c.SPACE_TYPE,
              c.PLAYER_COUNT, pl.PRICE, c.STATUS, c.DESCRIPTION, c.ADDRESS
            """,
            (rs, rowNum) ->
                new CourtDetailResponse(
                    rs.getLong("COURT_ID"),
                    rs.getString("COURT_NAME"),
                    rs.getString("COURT_TYPE_NAME"),
                    rs.getString("SURFACE_TYPE"),
                    rs.getString("SPACE_TYPE"),
                    rs.getInt("PLAYER_COUNT"),
                    rs.getBigDecimal("PRICE"),
                    rs.getString("STATUS"),
                    rs.getString("DESCRIPTION"),
                    rs.getString("ADDRESS"),
                    rs.getBigDecimal("AVG_SCORE"),
                    rs.getLong("TOTAL_RATINGS"),
                    List.of()),
            courtId)
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sân."));

    List<RatingResponse> ratings =
        jdbcTemplate.query(
            """
            SELECT cu.FULL_NAME, cr.SCORE, cr.COMMENT_TEXT, cr.RATING_TIME
            FROM COURT_RATING cr
            JOIN CUSTOMER cu ON cu.CUSTOMER_ID = cr.CUSTOMER_ID
            WHERE cr.COURT_ID = ?
            ORDER BY cr.RATING_TIME DESC
            FETCH FIRST 10 ROWS ONLY
            """,
            (rs, rowNum) ->
                new RatingResponse(
                    rs.getString("FULL_NAME"),
                    rs.getLong("SCORE"),
                    rs.getString("COMMENT_TEXT"),
                    rs.getTimestamp("RATING_TIME").toLocalDateTime()),
            courtId);

    return new CourtDetailResponse(
        detail.courtId(),
        detail.courtName(),
        detail.courtType(),
        detail.surfaceType(),
        detail.spaceType(),
        detail.playerCount(),
        detail.price(),
        detail.status(),
        detail.description(),
        detail.address(),
        detail.averageRating(),
        detail.totalRatings(),
        ratings);
  }

  public BookingResponse createBooking(AuthenticatedUser user, BookingCreateRequest request) {
    LocalDate bookingDate = LocalDate.parse(request.bookingDate());

    if (bookingDate.isBefore(LocalDate.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể đặt sân cho ngày trong quá khứ.");
    }

    Long customerId =
        jdbcTemplate.queryForObject(
            "SELECT CUSTOMER_ID FROM CUSTOMER WHERE ACCOUNT_ID = ?",
            Long.class,
            user.getAccountId());
    if (customerId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài khoản chưa có hồ sơ khách hàng.");
    }

    List<BookingResponse> conflicts =
        jdbcTemplate.query(
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
            JOIN COURT c ON c.COURT_ID = b.COURT_ID
            JOIN CUSTOMER cu ON cu.CUSTOMER_ID = b.CUSTOMER_ID
            LEFT JOIN EMPLOYEE e ON e.EMPLOYEE_ID = b.EMPLOYEE_ID
            WHERE b.COURT_ID = ? AND b.BOOKING_DATE = ? AND b.SLOT_LABEL = ?
              AND b.STATUS IN ('PENDING', 'CONFIRMED', 'COMPLETED')
            """,
            (rs, rowNum) -> mapBooking(rs),
            request.courtId(),
            java.sql.Date.valueOf(bookingDate),
            request.slotLabel().trim());

    if (!conflicts.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ này đã được đặt.");
    }

    BigDecimal price =
        jdbcTemplate.queryForObject(
            """
            SELECT pl.PRICE
            FROM COURT c
            JOIN PRICE_LIST pl ON pl.COURT_TYPE_ID = c.COURT_TYPE_ID
            WHERE c.COURT_ID = ?
            """,
            BigDecimal.class,
            request.courtId());

    if (price == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bảng giá cho sân.");
    }

    BigDecimal deposit = price.divide(BigDecimal.valueOf(2));

    jdbcTemplate.update(
        """
        INSERT INTO BOOKING (CUSTOMER_ID, COURT_ID, EMPLOYEE_ID, BOOKING_DATE, SLOT_LABEL, STATUS, TOTAL_AMOUNT, DEPOSIT_AMOUNT)
        VALUES (?, ?, NULL, ?, ?, 'PENDING', ?, ?)
        """,
        customerId,
        request.courtId(),
        java.sql.Date.valueOf(bookingDate),
        request.slotLabel().trim(),
        price,
        deposit);

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
            JOIN COURT c ON c.COURT_ID = b.COURT_ID
            JOIN CUSTOMER cu ON cu.CUSTOMER_ID = b.CUSTOMER_ID
            LEFT JOIN EMPLOYEE e ON e.EMPLOYEE_ID = b.EMPLOYEE_ID
            WHERE b.CUSTOMER_ID = ? AND b.COURT_ID = ? AND b.BOOKING_DATE = ? AND b.SLOT_LABEL = ?
            ORDER BY b.BOOKING_ID DESC
            FETCH FIRST 1 ROWS ONLY
            """,
            (rs, rowNum) -> mapBooking(rs),
            customerId,
            request.courtId(),
            java.sql.Date.valueOf(bookingDate),
            request.slotLabel().trim())
        .stream()
        .findFirst()
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được booking."));
  }

  private ProfileResponse mapProfile(ResultSet rs) throws SQLException {
    Long points = rs.getObject("POINTS") == null ? null : rs.getLong("POINTS");
    return new ProfileResponse(
        rs.getLong("ACCOUNT_ID"),
        rs.getString("USERNAME"),
        rs.getString("DISPLAY_NAME"),
        rs.getString("ROLE_NAME"),
        rs.getString("PHONE"),
        rs.getString("EMAIL"),
        rs.getString("MEMBER_LEVEL"),
        points,
        rs.getString("POSITION_NAME"));
  }

  private BookingResponse mapBooking(ResultSet rs) throws SQLException {
    Timestamp ts = rs.getTimestamp("BOOKING_DATE");
    LocalDate bookingDate =
        ts != null ? ts.toLocalDateTime().toLocalDate() : rs.getDate("BOOKING_DATE").toLocalDate();
    return new BookingResponse(
        rs.getLong("BOOKING_ID"),
        rs.getString("COURT_NAME"),
        rs.getString("CUSTOMER_NAME"),
        rs.getString("STAFF_NAME"),
        bookingDate,
        rs.getString("SLOT_LABEL"),
        rs.getString("STATUS"),
        rs.getBigDecimal("TOTAL_AMOUNT"),
        rs.getBigDecimal("DEPOSIT_AMOUNT"));
  }
}
