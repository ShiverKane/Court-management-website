package com.courtmanagement.backend.service;

import com.courtmanagement.backend.dto.ApiDtos.LoginRequest;
import com.courtmanagement.backend.dto.ApiDtos.LoginResponse;
import com.courtmanagement.backend.dto.ApiDtos.MeResponse;
import com.courtmanagement.backend.security.AuthenticatedUser;
import com.courtmanagement.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
  }

  public LoginResponse login(LoginRequest request) {
    AuthenticatedUser user =
        (AuthenticatedUser)
            authenticationManager
                .authenticate(
                    new UsernamePasswordAuthenticationToken(
                        request.username(), request.password()))
                .getPrincipal();

    return new LoginResponse(
        jwtService.generateToken(user),
        "Bearer",
        user.getUsername(),
        user.getDisplayName(),
        user.getRoleName().name());
  }

  public MeResponse me(AuthenticatedUser user) {
    return new MeResponse(
        user.getAccountId(), user.getUsername(), user.getDisplayName(), user.getRoleName().name());
  }
}
