package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.BookingResponse;
import com.courtmanagement.backend.dto.ApiDtos.SummaryResponse;
import com.courtmanagement.backend.service.DashboardService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

  private final DashboardService dashboardService;

  public StaffController(DashboardService dashboardService) {
    this.dashboardService = dashboardService;
  }

  @GetMapping("/bookings")
  public ResponseEntity<List<BookingResponse>> bookings() {
    return ResponseEntity.ok(dashboardService.getStaffBookings());
  }

  @GetMapping("/summary")
  public ResponseEntity<SummaryResponse> summary() {
    return ResponseEntity.ok(dashboardService.getSummary());
  }
}
