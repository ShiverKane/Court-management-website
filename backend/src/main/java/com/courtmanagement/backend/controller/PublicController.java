package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.CourtResponse;
import com.courtmanagement.backend.dto.ApiDtos.CourtDetailResponse;
import com.courtmanagement.backend.dto.ApiDtos.LeaderboardEntry;
import com.courtmanagement.backend.service.CustomerFeatureService;
import com.courtmanagement.backend.service.DashboardService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

  private final DashboardService dashboardService;
  private final CustomerFeatureService customerFeatureService;
  private final JdbcTemplate jdbcTemplate;

  public PublicController(
      DashboardService dashboardService,
      CustomerFeatureService customerFeatureService,
      JdbcTemplate jdbcTemplate) {
    this.dashboardService = dashboardService;
    this.customerFeatureService = customerFeatureService;
    this.jdbcTemplate = jdbcTemplate;
  }

  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health() {
    return ResponseEntity.ok(Map.of("status", "ok"));
  }

  @GetMapping("/db-health")
  public ResponseEntity<Map<String, Integer>> dbHealth() {
    Integer value = jdbcTemplate.queryForObject("SELECT 1 FROM dual", Integer.class);
    return ResponseEntity.ok(Map.of("db", value == null ? 0 : value));
  }

  @GetMapping("/courts")
  public ResponseEntity<List<CourtResponse>> courts() {
    return ResponseEntity.ok(dashboardService.getCourts());
  }

  @GetMapping("/courts/{courtId}")
  public ResponseEntity<CourtDetailResponse> courtDetail(@PathVariable Long courtId) {
    return ResponseEntity.ok(customerFeatureService.getCourtDetail(courtId));
  }

  @GetMapping("/ratings/leaderboard")
  public ResponseEntity<List<LeaderboardEntry>> leaderboard() {
    return ResponseEntity.ok(dashboardService.getLeaderboard());
  }
}
