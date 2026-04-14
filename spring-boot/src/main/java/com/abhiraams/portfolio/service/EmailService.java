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
            log.error("Failed to send email via Gmail API: {}", e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }
}
