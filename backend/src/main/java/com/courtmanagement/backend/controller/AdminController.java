package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.RevenueResponse;
import com.courtmanagement.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final DashboardService dashboardService;

  public AdminController(DashboardService dashboardService) {
    this.dashboardService = dashboardService;
  }

  @GetMapping("/revenue")
  public ResponseEntity<RevenueResponse> revenue() {
    return ResponseEntity.ok(dashboardService.getRevenueSummary());
  }
}
