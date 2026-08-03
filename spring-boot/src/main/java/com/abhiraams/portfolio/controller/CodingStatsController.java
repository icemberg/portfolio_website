package com.abhiraams.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.abhiraams.portfolio.dto.CodingStatsResponse;
import com.abhiraams.portfolio.service.CodingStatsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/coding-stats")
public class CodingStatsController {

    private final CodingStatsService codingStatsService;

    @GetMapping
    public ResponseEntity<CodingStatsResponse> getCodingStats() {
        CodingStatsResponse stats = codingStatsService.getCodingStats();
        return ResponseEntity.ok(stats);
    }
}
