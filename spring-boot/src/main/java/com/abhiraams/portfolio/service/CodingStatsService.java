package com.abhiraams.portfolio.service;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.abhiraams.portfolio.dto.CodingStatsResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodingStatsService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${leetcode.username}")
    private String leetcodeUsername;

    @Value("${hackerrank.username}")
    private String hackerrankUsername;

    @Value("${gfg.username}")
    private String gfgUsername;

    @Cacheable(value = "codingStats", sync = true)
    public CodingStatsResponse getCodingStats() {
        CodingStatsResponse response = new CodingStatsResponse();

        response.setLeetcode(fetchLeetCodeStats());
        response.setHackerrank(fetchHackerRankStats());
        response.setGfg(fetchGfgStats());

        return response;
    }

    private CodingStatsResponse.CodingPlatformStats fetchLeetCodeStats() {
        String url = "https://leetcode.com/graphql";
        String query = "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count submissions } } } }\",\"variables\":{\"username\":\"" + leetcodeUsername + "\"}}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "Mozilla/5.0");

        HttpEntity<String> request = new HttpEntity<>(query, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            Map data = (Map) response.getBody().get("data");
            Map matchedUser = (Map) data.get("matchedUser");
            Map submitStats = (Map) matchedUser.get("submitStats");
            Object acSubmissionNum = submitStats.get("acSubmissionNum");

            Integer totalSolved = 0;
            if (acSubmissionNum instanceof Iterable) {
                for (Object item : (Iterable<?>) acSubmissionNum) {
                    Map pair = (Map) item;
                    if ("All".equals(pair.get("difficulty"))) {
                        totalSolved = ((Number) pair.get("count")).intValue();
                        break;
                    }
                }
            }

            CodingStatsResponse.CodingPlatformStats stats = new CodingStatsResponse.CodingPlatformStats();
            stats.setProfileUrl("https://www.leetcode.com/in/" + leetcodeUsername);
            stats.setSolvedCount(totalSolved);
            return stats;
        } catch (Exception e) {
            log.error("Failed fetching LeetCode stats", e);
            CodingStatsResponse.CodingPlatformStats stats = new CodingStatsResponse.CodingPlatformStats();
            stats.setProfileUrl("https://www.leetcode.com/in/" + leetcodeUsername);
            stats.setSolvedCount(null);
            return stats;
        }
    }

    private CodingStatsResponse.CodingPlatformStats fetchHackerRankStats() {
        String url = "https://www.hackerrank.com/rest/hackers/" + hackerrankUsername + "/badges";
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            Integer totalSolved = 0;
            if (body != null && body.containsKey("models") && body.get("models") instanceof Iterable) {
                for (Object item : (Iterable<?>) body.get("models")) {
                    if (item instanceof Map) {
                        Map<String, Object> badge = (Map<String, Object>) item;
                        if (badge.containsKey("solved")) {
                            totalSolved += parseNumber(badge.get("solved")).intValue();
                        }
                    }
                }
            }

            CodingStatsResponse.CodingPlatformStats platformStats = new CodingStatsResponse.CodingPlatformStats();
            platformStats.setProfileUrl("https://www.hackerrank.com/profile/" + hackerrankUsername);
            platformStats.setSolvedCount(totalSolved > 0 ? totalSolved : null);
            return platformStats;
        } catch (Exception e) {
            log.error("Failed fetching HackerRank stats", e);
            CodingStatsResponse.CodingPlatformStats platformStats = new CodingStatsResponse.CodingPlatformStats();
            platformStats.setProfileUrl("https://www.hackerrank.com/profile/" + hackerrankUsername);
            platformStats.setSolvedCount(null);
            return platformStats;
        }
    }

    private CodingStatsResponse.CodingPlatformStats fetchGfgStats() {
        String url = "https://gfgstatscard.vercel.app/" + gfgUsername + "?raw=true";
        String profileUrl = "https://www.geeksforgeeks.org/user/" + gfgUsername + "/";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            Integer totalSolved = 0;
            if (body != null) {
                totalSolved += parseNumber(body.get("School")).intValue();
                totalSolved += parseNumber(body.get("Basic")).intValue();
                totalSolved += parseNumber(body.get("Easy")).intValue();
                totalSolved += parseNumber(body.get("Medium")).intValue();
                totalSolved += parseNumber(body.get("Hard")).intValue();
            }

            CodingStatsResponse.CodingPlatformStats platformStats = new CodingStatsResponse.CodingPlatformStats();
            platformStats.setProfileUrl(profileUrl);
            platformStats.setSolvedCount(totalSolved > 0 ? totalSolved : null);
            return platformStats;
        } catch (Exception e) {
            log.error("Failed fetching GFG stats", e);
            CodingStatsResponse.CodingPlatformStats platformStats = new CodingStatsResponse.CodingPlatformStats();
            platformStats.setProfileUrl(profileUrl);
            platformStats.setSolvedCount(null);
            return platformStats;
        }
    }

    private Number parseNumber(Object value) {
        if (value instanceof Number) {
            return (Number) value;
        }
        if (value instanceof String) {
            try {
                return Integer.valueOf((String) value);
            } catch (NumberFormatException ex) {
                return 0;
            }
        }
        return 0;
    }
}
