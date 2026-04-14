package com.abhiraams.portfolio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final GmailApiService gmailApiService;

    public void sendEmail(String to, String subject, String body) {
        try {
            gmailApiService.sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Email service failed to send message: {}", e.getMessage(), e);
            throw new RuntimeException("Email sending failed", e);
        }
    }
}
