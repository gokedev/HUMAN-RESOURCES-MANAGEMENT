package com.hrsaas.repository;

import com.hrsaas.entity.Company;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class CompanyRepositoryTest {

    @Autowired
    private CompanyRepository companyRepository;

    @Test
    void findBySlug_ReturnsMatchingCompany() {
        companyRepository.save(Company.builder()
                .name("Acme Inc").slug("acme-inc").isActive(true).build());

        Optional<Company> result = companyRepository.findBySlug("acme-inc");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Acme Inc");
    }

    @Test
    void findBySlug_UnknownSlug_ReturnsEmpty() {
        assertThat(companyRepository.findBySlug("ghost")).isEmpty();
    }

    @Test
    void existsBySlug_TrueForExisting_FalseOtherwise() {
        companyRepository.save(Company.builder()
                .name("Acme Inc").slug("acme-inc").isActive(true).build());

        assertThat(companyRepository.existsBySlug("acme-inc")).isTrue();
        assertThat(companyRepository.existsBySlug("acme-inc-1")).isFalse();
    }

    @Test
    void slugMustBeUnique_ThrowsOnDuplicate() {
        companyRepository.save(Company.builder()
                .name("Acme Inc").slug("dup-slug").isActive(true).build());

        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            companyRepository.saveAndFlush(Company.builder()
                    .name("Copycat Inc").slug("dup-slug").isActive(true).build());
        });
    }
}
