package com.abhiraams.portfolio.controller;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@Slf4j
public class OAuthController {

    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        log.info("Redirecting to Google OAuth2 authorization flow");
        response.sendRedirect("/oauth2/authorization/google");
    }

    @GetMapping("/")
    public String index() {
        log.info("Root path accessed. User is authenticated.");
        return "<h1>Authorization Successful!</h1>" +
               "<p>Your Gmail API token has been saved to the database.</p>" +
               "<p>You can now close this tab and try the contact form.</p>";
    }
}
