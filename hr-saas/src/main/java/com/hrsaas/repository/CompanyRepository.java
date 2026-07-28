package com.hrsaas.repository;

import com.hrsaas.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
