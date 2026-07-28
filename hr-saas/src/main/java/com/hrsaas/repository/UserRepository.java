package com.hrsaas.repository;

import com.hrsaas.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByCompanyIdAndEmailIgnoreCase(UUID companyId, String email);
    Optional<User> findByIdAndCompanyId(UUID id, UUID companyId);
    Page<User> findByCompanyId(UUID companyId, Pageable pageable);
    boolean existsByCompanyIdAndEmailIgnoreCase(UUID companyId, String email);
}
