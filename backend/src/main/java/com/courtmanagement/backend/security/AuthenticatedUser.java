package com.courtmanagement.backend.security;

import com.courtmanagement.backend.model.RoleName;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AuthenticatedUser implements UserDetails {

  private final Long accountId;
  private final String username;
  private final String passwordHash;
  private final String displayName;
  private final RoleName roleName;
  private final boolean enabled;

  public AuthenticatedUser(
      Long accountId,
      String username,
      String passwordHash,
      String displayName,
      RoleName roleName,
      boolean enabled) {
    this.accountId = accountId;
    this.username = username;
    this.passwordHash = passwordHash;
    this.displayName = displayName;
    this.roleName = roleName;
    this.enabled = enabled;
  }

  public Long getAccountId() {
    return accountId;
  }

  public String getDisplayName() {
    return displayName;
  }

  public RoleName getRoleName() {
    return roleName;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + roleName.name()));
  }

  @Override
  public String getPassword() {
    return passwordHash;
  }

  @Override
  public String getUsername() {
    return username;
  }

  @Override
  public boolean isEnabled() {
    return enabled;
  }
}
