package com.hrsaas.repository;

import com.hrsaas.entity.User;
import com.hrsaas.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByCompanyIdAndEmailIgnoreCase(UUID companyId, String email);
    Optional<User> findByIdAndCompanyId(UUID id, UUID companyId);
    Page<User> findByCompanyId(UUID companyId, Pageable pageable);
    boolean existsByCompanyIdAndEmailIgnoreCase(UUID companyId, String email);

    // Analytical query methods
    @Query("SELECT COUNT(u) FROM User u WHERE u.companyId = :companyId AND u.dateOfHire >= :startDate AND u.dateOfHire <= :endDate")
    Long countEmployeesByHireDateRange(@Param("companyId") UUID companyId,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(u) FROM User u WHERE u.companyId = :companyId AND u.status = :status AND u.updatedAt >= :startDate AND u.updatedAt <= :endDate")
    Long countEmployeesByStatusChangeDateRange(@Param("companyId") UUID companyId,
                                               @Param("status") UserStatus status,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    // Derived query method for counting by company and status
    Long countByCompanyIdAndStatus(UUID companyId, UserStatus status);
}
