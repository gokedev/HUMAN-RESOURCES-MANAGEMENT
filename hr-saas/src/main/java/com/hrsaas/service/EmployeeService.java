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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
public class EmployeeService {

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

        return employee;
    }

    public Page<User> listEmployees(Pageable pageable) {
        return userRepository.findByCompanyId(TenantContext.getTenantId(), pageable);
    }

    public User getEmployee(UUID employeeId) {
        return userRepository.findByIdAndCompanyId(employeeId, TenantContext.getTenantId())
                .orElseThrow(() -> ApiException.notFound("Employee not found"));
    }

    @Transactional
    public User updateEmployee(UUID employeeId, CreateEmployeeRequest request) {
        User employee = getEmployee(employeeId);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhone(request.getPhone());
        employee.setJobTitle(request.getJobTitle());
        employee.setDepartmentId(request.getDepartmentId());
        employee.setManagerId(request.getManagerId());
        employee.setDateOfHire(request.getDateOfHire());
        return userRepository.save(employee);
    }

    @Transactional
    public void deactivateEmployee(UUID employeeId) {
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.SUSPENDED);
        userRepository.save(employee);
    }

    @Transactional
    public void reactivateEmployee(UUID employeeId) {
        User employee = getEmployee(employeeId);
        employee.setStatus(UserStatus.ACTIVE);
        userRepository.save(employee);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
