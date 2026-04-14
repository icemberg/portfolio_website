package com.abhiraams.portfolio.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class OAuthController {

    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        // Redirect to the Google authorization flow
        response.sendRedirect("/oauth2/authorization/google");
    }
}
