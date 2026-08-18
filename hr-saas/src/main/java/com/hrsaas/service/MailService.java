package com.hrsaas.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final RestTemplate restTemplate;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    public MailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Async
    public void sendCompanyWelcomeEmail(String toEmail, String companyName, String companySlug) {
        String subject = "Welcome to HR SaaS, " + companyName;
        String body =
                "Hi,<br><br>" +
                "Your company workspace \"" + companyName + "\" has been created.<br>" +
                "Your company login identifier (slug) is: " + companySlug + "<br><br>" +
                "You can log in at: <a href=\"" + frontendBaseUrl + "/login\">" + frontendBaseUrl + "/login</a><br><br>" +
                "Thanks,<br>HR SaaS Team";
        send(toEmail, subject, body);
    }

    @Async
    public void sendEmployeeInvitation(String toEmail, String firstName, String companyName, String inviteLink) {
        String subject = "You have been invited to join " + companyName + " on HR SaaS";
        String body =
                "Hi " + firstName + ",<br><br>" +
                "You have been added as an employee at " + companyName + ".<br>" +
                "Click the link below to set your password and activate your account:<br><br>" +
                "<a href=\"" + inviteLink + "\">" + inviteLink + "</a><br><br>" +
                "This link expires in 72 hours.<br><br>" +
                "Thanks,<br>HR SaaS Team";
        send(toEmail, subject, body);
    }

    @Async
    public void sendLeaveStatusEmail(String toEmail, String firstName, String status, String leaveType) {
        String subject = "Your leave request has been " + status.toLowerCase();
        String body =
                "Hi " + firstName + ",<br><br>" +
                "Your " + leaveType + " leave request has been " + status.toLowerCase() + ".<br><br>" +
                "Thanks,<br>HR SaaS Team";
        send(toEmail, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink) {
        String subject = "Reset your HR SaaS password";
        String body =
                "Hi " + firstName + ",<br><br>" +
                "We received a request to reset your password. Click the link below to choose a new one:<br><br>" +
                "<a href=\"" + resetLink + "\">" + resetLink + "</a><br><br>" +
                "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.<br><br>" +
                "Thanks,<br>HR SaaS Team";
        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String htmlBody) {
        try {
            String url = "https://api.brevo.com/v3/sendEmail";

            HttpHeaders headers = new HttpHeaders();
            headers.set("api-key", brevoApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> emailData = new HashMap<>();
            emailData.put("sender", Map.of(
                    "name", "HR SaaS",
                    "email", fromAddress
            ));
            emailData.put("to", new Object[]{Map.of(
                    "email", toEmail,
                    "name", "" // Brevo requires name field, but we can leave empty
            )});
            emailData.put("subject", subject);
            emailData.put("htmlContent", htmlBody);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Brevo API to {} — subject: {}", toEmail, subject);
            } else {
                log.error("Failed to send email via Brevo API to {}: HTTP {}", toEmail, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}