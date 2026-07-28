package com.hrsaas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendCompanyWelcomeEmail(String toEmail, String companyName, String companySlug) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Welcome to HR SaaS, " + companyName);
        message.setText(
                "Hi,\n\n" +
                "Your company workspace \"" + companyName + "\" has been created.\n" +
                "Your company login identifier (slug) is: " + companySlug + "\n\n" +
                "You can log in at: " + frontendBaseUrl + "/login\n\n" +
                "Thanks,\nHR SaaS Team"
        );
        mailSender.send(message);
    }

    @Async
    public void sendEmployeeInvitation(String toEmail, String firstName, String companyName, String inviteLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("You have been invited to join " + companyName + " on HR SaaS");
        message.setText(
                "Hi " + firstName + ",\n\n" +
                "You have been added as an employee at " + companyName + ".\n" +
                "Click the link below to set your password and activate your account:\n\n" +
                inviteLink + "\n\n" +
                "This link expires in 72 hours.\n\n" +
                "Thanks,\nHR SaaS Team"
        );
        mailSender.send(message);
    }

    @Async
    public void sendLeaveStatusEmail(String toEmail, String firstName, String status, String leaveType) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your leave request has been " + status.toLowerCase());
        message.setText(
                "Hi " + firstName + ",\n\n" +
                "Your " + leaveType + " leave request has been " + status.toLowerCase() + ".\n\n" +
                "Thanks,\nHR SaaS Team"
        );
        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Reset your HR SaaS password");
        message.setText(
                "Hi " + firstName + ",\n\n" +
                "We received a request to reset your password. Click the link below to choose a new one:\n\n" +
                resetLink + "\n\n" +
                "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n" +
                "Thanks,\nHR SaaS Team"
        );
        mailSender.send(message);
    }
}
