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
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.hrsaas.dto.EmployeeCounts;
import com.hrsaas.dto.HeadcountTrendData;
import com.hrsaas.dto.TrendDataPoint;

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

    @Transactional
    public User createEmployee(CreateEmployeeRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Creating employee with email={} for company={}", request.getEmail(), tenantId);

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
                .build();
        employee = userRepository.save(employee);

        String token = generateSecureToken();
        Invitation invitation = Invitation.builder()
                .companyId(tenantId)
                .userId(employee.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(inviteExpirationHours))
                .build();
        invitationRepository.save(invitation);

        String inviteLink = frontendBaseUrl + "/accept-invite?token=" + token;
        mailService.sendEmployeeInvitation(employee.getEmail(), employee.getFirstName(), company.getName(), inviteLink);

        log.info("Employee created successfully: id={}, email={}", employee.getId(), employee.getEmail());
        return employee;
    }

    public Page<User> listEmployees(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing employees for company={}", tenantId);
        return userRepository.findByCompanyId(tenantId, pageable);
    }

    public User getEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Fetching employee={} for company={}", employeeId, tenantId);
        return userRepository.findByIdAndCompanyId(employeeId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Employee not found"));
    }

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
        User saved = userRepository.save(employee);
        log.info("Employee updated successfully: id={}", saved.getId());
        return saved;
    }

    @Transactional
    public void deactivateEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Deactivating employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.SUSPENDED);
        userRepository.save(employee);
        log.info("Employee deactivated: id={}", employeeId);
    }

    @Transactional
    public void reactivateEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getTenantId();
        log.info("Reactivating employee={} for company={}", employeeId, tenantId);
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.ACTIVE);
        userRepository.save(employee);
        log.info("Employee reactivated: id={}", employeeId);
    }

    // Analytical methods for dashboard
    public HeadcountTrendData getHeadcountTrend(int months) {
        UUID tenantId = TenantContext.getTenantId();
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(months);

        // Get total hires in the period
        Long hiresCount = userRepository.countEmployeesByHireDateRange(
                tenantId, startDate, endDate);

        // Get total separations (deactivated/suspended employees) in the period
        Long separationsCount = userRepository.countEmployeesByStatusChangeDateRange(
                tenantId, UserStatus.SUSPENDED, startDate, endDate);

        // Build trend data - for MVP, return single data points representing totals
        List<TrendDataPoint> hiresData = new java.util.ArrayList<>();
        hiresData.add(new TrendDataPoint("Hires", hiresCount.intValue()));

        List<TrendDataPoint> separationsData = new java.util.ArrayList<>();
        separationsData.add(new TrendDataPoint("Separations", separationsCount.intValue()));

        return new HeadcountTrendData(hiresData, separationsData);
    }

    public EmployeeCounts getActiveVsPendingCounts() {
        UUID tenantId = TenantContext.getTenantId();
        long activeCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.ACTIVE);
        long pendingCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.PENDING);
        long suspendedCount = userRepository.countByCompanyIdAndStatus(tenantId, UserStatus.SUSPENDED);

        return new EmployeeCounts(activeCount, pendingCount, suspendedCount);
    }


    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
