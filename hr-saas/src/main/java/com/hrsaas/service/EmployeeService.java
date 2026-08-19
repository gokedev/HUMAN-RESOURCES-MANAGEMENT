package com.hrsaas.service;

import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.entity.Company;
import com.hrsaas.entity.Invitation;
import com.hrsaas.entity.User;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.CompanyRepository;
import com.hrsaas.repository.InvitationRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import com.hrsaas.dto.EmployeeCounts;
import com.hrsaas.dto.HeadcountTrendData;
import com.hrsaas.dto.TrendDataPoint;

/**
 * Employee lifecycle: create, invite, update, activate/deactivate, delete.
 * All queries are scoped to the current tenant via TenantContext.
 */
@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final InvitationRepository invitationRepository;
    private final MailService mailService;

    @Value("${app.invite.expiration-hours}")
    private long inviteExpirationHours;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public EmployeeService(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            InvitationRepository invitationRepository,
            MailService mailService
    ) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.invitationRepository = invitationRepository;
        this.mailService = mailService;
    }

    // ── Create employee ───────────────────────────

    /**
     * Creates a PENDING user + invitation token, sends invite email.
     * Employee must accept the invite to set password and become ACTIVE.
     */
    @Transactional
    public User createEmployee(CreateEmployeeRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Creating employee: email={}, company={}", request.getEmail(), tenantId);

        if (userRepository.existsByCompanyIdAndEmailIgnoreCase(tenantId, request.getEmail())) {
            throw ApiException.conflict("An employee with this email already exists in your company");
        }

        Company company = companyRepository.findById(tenantId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));

        User employee = User.builder()
                .companyId(tenantId)
                .email(request.getEmail().toLowerCase(Locale.ROOT))
                .role(Role.EMPLOYEE)
                .status(UserStatus.PENDING)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .jobTitle(request.getJobTitle())
                .departmentId(request.getDepartmentId())
                .managerId(request.getManagerId())
                .dateOfHire(request.getDateOfHire())
                .baseSalary(request.getBaseSalary())
                .build();
        employee = userRepository.save(employee);

        // Create invitation token (valid for configured hours, default 72h)
        String token = generateSecureToken();
        Invitation invitation = Invitation.builder()
                .companyId(tenantId)
                .userId(employee.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(inviteExpirationHours))
                .build();
        invitationRepository.save(invitation);

        String inviteLink = frontendBaseUrl + "/accept-invitation?token=" + token;
        mailService.sendEmployeeInvitation(employee.getEmail(), employee.getFirstName(), company.getName(), inviteLink);

        log.info("Employee created: id={}, email={}", employee.getId(), employee.getEmail());
        return employee;
    }

    // ── CRUD ──────────────────────────────────────

    /** Lists all employees in the current company (paginated). */
    public Page<User> listEmployees(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing employees: company={}", tenantId);
        return userRepository.findByCompanyId(tenantId, pageable);
    }

    /** Fetches a single employee by ID, scoped to the current company. */
    public User getEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Fetching employee={} for company={}", employeeId, tenantId);
        return userRepository.findByIdAndCompanyId(employeeId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Employee not found"));
    }

    /** Updates profile fields (name, phone, job title, department, salary, etc.). */
    @Transactional
    public User updateEmployee(UUID employeeId, CreateEmployeeRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Updating employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhone(request.getPhone());
        employee.setJobTitle(request.getJobTitle());
        employee.setDepartmentId(request.getDepartmentId());
        employee.setManagerId(request.getManagerId());
        employee.setDateOfHire(request.getDateOfHire());
        employee.setBaseSalary(request.getBaseSalary());
        User saved = userRepository.save(employee);
        log.info("Employee updated: id={}", saved.getId());
        return saved;
    }

    // ── Status changes ────────────────────────────

    /** Sets status to SUSPENDED — employee can no longer log in. */
    @Transactional
    public void deactivateEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Deactivating employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.SUSPENDED);
        userRepository.save(employee);
        log.info("Employee deactivated: id={}", employeeId);
    }

    /** Sets status back to ACTIVE. */
    @Transactional
    public void reactivateEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Reactivating employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.ACTIVE);
        userRepository.save(employee);
        log.info("Employee reactivated: id={}", employeeId);
    }

    /** Hard-deletes the employee and any unaccepted invitation. */
    @Transactional
    public void deleteEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Deleting employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        invitationRepository.findByUserIdAndAcceptedAtIsNull(employee.getId())
                .ifPresent(invitationRepository::delete);
        userRepository.delete(employee);
        log.info("Employee deleted: id={}", employeeId);
    }

    // ── Invitation management ─────────────────────

    /** Regenerates the token and resends the invite email (PENDING employees only). */
    @Transactional
    public void resendInvitation(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        User employee = getEmployee(employeeId);
        if (employee.getStatus() != UserStatus.PENDING) {
            throw ApiException.badRequest("Employee is not pending invitation");
        }

        Invitation invitation = invitationRepository.findByUserIdAndAcceptedAtIsNull(employee.getId())
                .orElseThrow(() -> ApiException.notFound("No pending invitation found for employee"));

        String token = generateSecureToken();
        invitation.setToken(token);
        invitation.setExpiresAt(LocalDateTime.now().plusHours(inviteExpirationHours));
        invitationRepository.save(invitation);

        String inviteLink = frontendBaseUrl + "/accept-invitation?token=" + token;
        mailService.sendEmployeeInvitation(employee.getEmail(), employee.getFirstName(),
                companyRepository.findById(tenantId).orElseThrow().getName(), inviteLink);
    }

    /** Deletes the pending invitation record (if any). */
    @Transactional
    public void revokeInvitation(UUID employeeId) {
        User employee = getEmployee(employeeId);
        Optional<Invitation> invitationOpt = invitationRepository.findByUserIdAndAcceptedAtIsNull(employee.getId());
        invitationOpt.ifPresent(invitationRepository::delete);
    }

    // ── Analytics (admin dashboard) ───────────────

    /** Returns hire/separation counts for the past N months. */
    public HeadcountTrendData getHeadcountTrend(int months) {
        UUID tenantId = TenantContext.getTenantId();
        java.time.LocalDate endDate = java.time.LocalDate.now();
        java.time.LocalDate startDate = endDate.minusMonths(months);

        Long hiresCount = userRepository.countEmployeesByHireDateRange(tenantId, startDate, endDate);
        Long separationsCount = userRepository.countEmployeesByStatusChangeDateRange(
                tenantId, UserStatus.SUSPENDED, startDate.atStartOfDay(), endDate.atTime(23, 59, 59));

        var hiresData = new java.util.ArrayList<TrendDataPoint>();
        hiresData.add(new TrendDataPoint("Hires", hiresCount.intValue()));

        var separationsData = new java.util.ArrayList<TrendDataPoint>();
        separationsData.add(new TrendDataPoint("Separations", separationsCount.intValue()));

        return new HeadcountTrendData(hiresData, separationsData);
    }

    /** Returns active, pending, and suspended employee counts. */
    public EmployeeCounts getActiveVsPendingCounts() {
        UUID tenantId = TenantContext.getTenantId();
        long activeCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.ACTIVE);
        long pendingCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.PENDING);
        long suspendedCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.SUSPENDED);
        return new EmployeeCounts(activeCount, pendingCount, suspendedCount);
    }

    // ── Helpers ───────────────────────────────────

    /** Generates a cryptographically secure random token (48 bytes, base64url). */
    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
