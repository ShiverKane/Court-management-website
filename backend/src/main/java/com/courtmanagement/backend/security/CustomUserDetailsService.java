package com.courtmanagement.backend.security;

import com.courtmanagement.backend.model.Account;
import com.courtmanagement.backend.repository.AccountRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final AccountRepository accountRepository;

  public CustomUserDetailsService(AccountRepository accountRepository) {
    this.accountRepository = accountRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Account account =
        accountRepository
            .findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản."));

    return new AuthenticatedUser(
        account.getAccountId(),
        account.getUsername(),
        account.getPasswordHash(),
        account.getDisplayName(),
        account.getRoleName(),
        "ACTIVE".equalsIgnoreCase(account.getStatus()));
  }
}
