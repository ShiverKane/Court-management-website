package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.DashboardPayload;
import com.courtmanagement.backend.security.AuthenticatedUser;
import com.courtmanagement.backend.service.AuthService;
import com.courtmanagement.backend.service.DashboardService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

  private final AuthService authService;
  private final DashboardService dashboardService;

  public DashboardController(AuthService authService, DashboardService dashboardService) {
    this.authService = authService;
    this.dashboardService = dashboardService;
  }

  @GetMapping("/dashboard")
  public ResponseEntity<DashboardPayload> dashboard(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok(
        new DashboardPayload(
            authService.me(user),
            dashboardService.getSummary(),
            dashboardService.getCourts(),
            dashboardService.getLeaderboard(),
            user.getRoleName().name().equals("CUSTOMER")
                ? dashboardService.getCustomerBookings(user)
                : List.of(),
            dashboardService.canViewStaffData(user) ? dashboardService.getStaffBookings() : List.of(),
            dashboardService.canViewAdminData(user)
                ? dashboardService.getRevenueSummary()
                : null));
  }
}
