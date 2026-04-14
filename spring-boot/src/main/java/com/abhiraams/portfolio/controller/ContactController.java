package com.abhiraams.portfolio.controller;

import com.abhiraams.portfolio.dto.ContactRequest;
import com.abhiraams.portfolio.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<String> sendContactMessage(@RequestBody ContactRequest request) {
        log.info("Received contact form request from: {}", request.getEmail());
        try {
            String subject = "New Portfolio Message: " + request.getSubject();
            String body = "Name: " + request.getName() + "\n" +
                          "Email: " + request.getEmail() + "\n\n" +
                          "Message:\n" + request.getMessage();

            // Sending to the user's email
            emailService.sendEmail("abhiraams2004@gmail.com", subject, body);

            log.info("Message from {} successfully relayed via Gmail API.", request.getEmail());
            return ResponseEntity.ok("Message relayed successfully.");
        } catch (Exception e) {
            log.error("Critical error in ContactController: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("System relay error: " + e.getMessage());
        }
    }
}
