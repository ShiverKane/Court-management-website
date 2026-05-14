package com.courtmanagement.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "ACCOUNT")
public class Account {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "ACCOUNT_ID")
  private Long accountId;

  @Column(name = "USERNAME", nullable = false, unique = true)
  private String username;

  @Column(name = "PASSWORD_HASH", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(name = "ROLE_NAME", nullable = false)
  private RoleName roleName;

  @Column(name = "DISPLAY_NAME", nullable = false)
  private String displayName;

  @Column(name = "STATUS", nullable = false)
  private String status;

  @Column(name = "CREATED_AT", nullable = false)
  private LocalDateTime createdAt;

  public Long getAccountId() {
    return accountId;
  }

  public String getUsername() {
    return username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public RoleName getRoleName() {
    return roleName;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getStatus() {
    return status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
