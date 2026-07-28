package com.hrsaas.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class AuthenticatedUser implements UserDetails {

    private final UUID userId;
    private final UUID tenantId;
    private final String email;
    private final String role;

    public AuthenticatedUser(UUID userId, UUID tenantId, String email, String role) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.email = email;
        this.role = role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
