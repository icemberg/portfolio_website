package com.abhiraams.portfolio.dto;

import lombok.Data;

@Data
public class CodingStatsResponse {

    private CodingPlatformStats leetcode;
    private CodingPlatformStats hackerrank;
    private CodingPlatformStats gfg;

    @Data
    public static class CodingPlatformStats {
        private String profileUrl;
        private Integer solvedCount;
    }
}
