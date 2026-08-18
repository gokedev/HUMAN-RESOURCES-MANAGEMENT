package com.hrsaas.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
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
            // Check if API key is configured
            if (brevoApiKey == null || brevoApiKey.isBlank()) {
                log.error("Brevo API key is not configured. Please set BREVO_API_KEY environment variable.");
                return;
            }

            // Validate inputs
            if (toEmail == null || toEmail.isBlank()) {
                log.error("To email is required");
                return;
            }
            if (fromAddress == null || fromAddress.isBlank()) {
                log.error("From address is not configured");
                return;
            }
            if (subject == null || subject.isBlank()) {
                log.error("Subject is required");
                return;
            }
            if (htmlBody == null || htmlBody.isBlank()) {
                log.error("HTML body is required");
                return;
            }

            String url = "https://api.brevo.com/v3/smtp/email";

            HttpHeaders headers = new HttpHeaders();
            headers.set("api-key", brevoApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));

            // Add more detailed logging
            log.debug("Brevo API Key (first 10 chars): {}", brevoApiKey != null ? brevoApiKey.substring(0, Math.min(10, brevoApiKey.length())) : "NULL");
            log.debug("From Address: {}", fromAddress);
            log.debug("To Email: {}", toEmail);
            log.debug("Subject: {}", subject);
            log.debug("HTML Body length: {}", htmlBody != null ? htmlBody.length() : 0);

            // Build request payload
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("sender", Map.of(
                    "name", "HR SaaS",
                    "email", fromAddress
            ));

            List<Map<String, String>> toList = new ArrayList<>();
            Map<String, String> toItem = new HashMap<>();
            String trimmedEmail = toEmail.trim();
            toItem.put("email", trimmedEmail);
            String name = trimmedEmail.isEmpty() ? "User" : trimmedEmail;
            toItem.put("name", name); // Use email as name - Brevo requires name field
            toList.add(toItem);
            emailData.put("to", toList);

            emailData.put("subject", subject);
            emailData.put("htmlContent", htmlBody);

            log.debug("Request payload: {}", emailData);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Brevo API to {} — subject: {}", toEmail, subject);
            } else {
                log.error("Failed to send email via Brevo API to {}: HTTP {} - Response: {}",
                        toEmail, response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}