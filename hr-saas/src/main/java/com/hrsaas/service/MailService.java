package com.hrsaas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class MailService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MailService.class);

    private final RestTemplate restTemplate;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${app.brevo.api-key}")
    private String brevoApiKey;

    @Value("${app.brevo.api-url}")
    private String brevoApiUrl;

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
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        headers.set("accept", "application/json");

        Map<String, Object> sender = new HashMap<>();
        sender.put("name", "HR SaaS");
        sender.put("email", fromAddress);

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("email", toEmail);

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", sender);
        payload.put("to", new Object[]{recipient});
        payload.put("subject", subject);
        payload.put("htmlContent", htmlBody);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            restTemplate.postForEntity(brevoApiUrl, request, String.class);
            log.info("Email sent successfully to {}", toEmail);
        } catch (HttpClientErrorException e) {
            log.error("Brevo API client error (status={}): {} — response: {}", e.getStatusCode().value(), e.getMessage(), e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            log.error("Brevo API server error (status={}): {} — response: {}", e.getStatusCode().value(), e.getMessage(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}