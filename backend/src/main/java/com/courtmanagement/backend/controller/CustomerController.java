package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.BookingCreateRequest;
import com.courtmanagement.backend.dto.ApiDtos.BookingResponse;
import com.courtmanagement.backend.dto.ApiDtos.ProfileResponse;
import com.courtmanagement.backend.security.AuthenticatedUser;
import com.courtmanagement.backend.service.CustomerFeatureService;
import com.courtmanagement.backend.service.DashboardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

  private final DashboardService dashboardService;
  private final CustomerFeatureService customerFeatureService;

  public CustomerController(
      DashboardService dashboardService, CustomerFeatureService customerFeatureService) {
    this.dashboardService = dashboardService;
    this.customerFeatureService = customerFeatureService;
  }

  @GetMapping("/bookings")
  public ResponseEntity<List<BookingResponse>> bookings(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok(dashboardService.getCustomerBookings(user));
  }

  @PostMapping("/bookings")
  public ResponseEntity<BookingResponse> createBooking(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody BookingCreateRequest request) {
    return ResponseEntity.ok(customerFeatureService.createBooking(user, request));
  }

  @GetMapping("/profile")
  public ResponseEntity<ProfileResponse> profile(@AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok(customerFeatureService.getProfile(user));
  }
}
