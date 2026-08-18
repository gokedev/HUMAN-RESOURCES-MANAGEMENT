package com.hrsaas.security;

import com.hrsaas.enums.Role;
import com.hrsaas.exception.ApiException;
import com.hrsaas.tenant.TenantContext;

public final class RoleGuard {

    private RoleGuard() {
    }

    public static void requireRole(Role expected) {
        String role = TenantContext.getRole();
        if (role == null || !role.equals(expected.name())) {
            throw ApiException.forbidden("You do not have permission to perform this action");
        }
    }

    public static void requireAnyRole(Role... allowed) {
        String role = TenantContext.getRole();
        if (role == null) {
            throw ApiException.forbidden("You do not have permission to perform this action");
        }
        for (Role r : allowed) {
            if (role.equals(r.name())) {
                return;
            }
        }
        throw ApiException.forbidden("You do not have permission to perform this action");
    }

    public static boolean hasRole(Role expected) {
        String role = TenantContext.getRole();
        return role != null && role.equals(expected.name());
    }
}
