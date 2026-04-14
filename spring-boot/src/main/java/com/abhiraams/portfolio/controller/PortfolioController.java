package com.abhiraams.portfolio.controller;

import com.abhiraams.portfolio.model.Profile;
import com.abhiraams.portfolio.service.PortfolioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/profile")
    public Profile getProfile() {
        return portfolioService.getFullProfile();
    }
}
