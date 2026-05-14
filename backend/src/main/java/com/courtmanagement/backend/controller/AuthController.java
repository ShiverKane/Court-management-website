package com.courtmanagement.backend.controller;

import com.courtmanagement.backend.dto.ApiDtos.LoginRequest;
import com.courtmanagement.backend.dto.ApiDtos.LoginResponse;
import com.courtmanagement.backend.dto.ApiDtos.MeResponse;
import com.courtmanagement.backend.dto.ApiDtos.ProfileResponse;
import com.courtmanagement.backend.dto.ApiDtos.RegisterRequest;
import com.courtmanagement.backend.dto.ApiDtos.RegisterResponse;
import com.courtmanagement.backend.security.AuthenticatedUser;
import com.courtmanagement.backend.service.AuthService;
import com.courtmanagement.backend.service.CustomerFeatureService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final CustomerFeatureService customerFeatureService;

  public AuthController(AuthService authService, CustomerFeatureService customerFeatureService) {
    this.authService = authService;
    this.customerFeatureService = customerFeatureService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/register")
  public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(customerFeatureService.register(request));
  }

  @GetMapping("/me")
  public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok(authService.me(user));
  }

  @GetMapping("/profile")
  public ResponseEntity<ProfileResponse> profile(@AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok(customerFeatureService.getProfile(user));
  }
}
