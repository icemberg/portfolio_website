package com.abhiraams.portfolio.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class CodingStatsResponse {

    private CodingPlatformStats leetcode;
    private CodingPlatformStats hackerrank;
    private CodingPlatformStats gfg;

    /** True if any platform could not be fetched; such responses must not be cached. */
    @JsonIgnore
    public boolean isIncomplete() {
        return isFailed(leetcode) || isFailed(hackerrank) || isFailed(gfg);
    }

    private static boolean isFailed(CodingPlatformStats stats) {
        return stats == null || stats.isFailed();
    }

    @Data
    public static class CodingPlatformStats {
        private String profileUrl;
        private Integer solvedCount;

        /** Server-side only: the upstream request failed (solvedCount is then null). */
        @JsonIgnore
        private boolean failed;
    }
}
