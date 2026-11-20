package com.abhiraams.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.abhiraams.portfolio.config.CacheConfig;
import com.abhiraams.portfolio.dto.CodingStatsResponse;

import tools.jackson.databind.json.JsonMapper;

class CodingStatsServiceTest {

    /** An upstream that accepts the TCP connection and then never sends a byte. */
    @Nested
    class Timeouts {

        private ServerSocket server;
        private final List<Socket> accepted = new ArrayList<>();

        @BeforeEach
        void startSilentServer() throws IOException {
            server = new ServerSocket(0, 50, InetAddress.getLoopbackAddress());
            Thread acceptor = new Thread(() -> {
                try {
                    while (!server.isClosed()) {
                        accepted.add(server.accept()); // hold it open, never respond
                    }
                } catch (IOException closed) {
                    // server closed at the end of the test
                }
            });
            acceptor.setDaemon(true);
            acceptor.start();
        }

        @AfterEach
        void stopServer() throws IOException {
            server.close();
            for (Socket socket : accepted) {
                socket.close();
            }
        }

        @Test
        void tlsHandshakeThatNeverCompletesTimesOut() {
            // the exact hang seen in production-like runs: stuck in SSLSocketImpl.startHandshake
            assertTimesOut("https://127.0.0.1:" + server.getLocalPort() + "/graphql");
        }

        @Test
        void responseThatNeverArrivesTimesOut() {
            assertTimesOut("http://127.0.0.1:" + server.getLocalPort() + "/rest/hackers/x/badges");
        }

        private void assertTimesOut(String url) {
            RestTemplate restTemplate = CodingStatsService.createRestTemplate();
            long start = System.nanoTime();

            assertThatThrownBy(() -> restTemplate.getForObject(url, String.class))
                    .isInstanceOf(ResourceAccessException.class);

            Duration elapsed = Duration.ofNanos(System.nanoTime() - start);
            assertThat(elapsed)
                    .isGreaterThanOrEqualTo(CodingStatsService.READ_TIMEOUT.minusSeconds(1))
                    .isLessThan(CodingStatsService.READ_TIMEOUT.plusSeconds(3));
        }
    }

    /** Successful results are cached; results with a failed platform are retried. */
    @Nested
    @SpringJUnitConfig(Caching.Config.class)
    @TestPropertySource(properties = {
            "leetcode.username=lc-user",
            "hackerrank.username=hr-user",
            "gfg.username=gfg-user",
    })
    class Caching {

        private static final String LEETCODE = "https://leetcode.com/graphql";
        private static final String HACKERRANK = "https://www.hackerrank.com/rest/hackers/hr-user/badges";
        private static final String GFG = "https://gfgstatscard.vercel.app/gfg-user?raw=true";

        @Configuration
        @EnableCaching
        @Import(CacheConfig.class)
        static class Config {
            @Bean
            RestTemplate restTemplate() {
                return new RestTemplate();
            }

            @Bean
            MockRestServiceServer upstream(RestTemplate restTemplate) {
                return MockRestServiceServer.bindTo(restTemplate).build();
            }

            @Bean
            CodingStatsService codingStatsService(RestTemplate restTemplate) {
                return new CodingStatsService(restTemplate);
            }
        }

        @Autowired
        CodingStatsService service;

        @Autowired
        MockRestServiceServer upstream;

        @Autowired
        CacheManager cacheManager;

        @BeforeEach
        void reset() {
            upstream.reset();
            cacheManager.getCache("codingStats").clear();
        }

        @Test
        void failedResultIsNotCachedAndTheNextRequestRetries() {
            // 1st request: every platform fails
            upstream.expect(requestTo(LEETCODE)).andExpect(method(HttpMethod.POST)).andRespond(withServerError());
            upstream.expect(requestTo(HACKERRANK)).andRespond(withServerError());
            upstream.expect(requestTo(GFG)).andRespond(withServerError());
            // 2nd request: everything succeeds
            expectAllSucceed();

            CodingStatsResponse first = service.getCodingStats();
            assertThat(first.isIncomplete()).isTrue();
            assertThat(first.getLeetcode().getSolvedCount()).isNull();

            CodingStatsResponse second = service.getCodingStats();
            assertThat(second.isIncomplete()).isFalse();
            assertThat(second.getLeetcode().getSolvedCount()).isEqualTo(321);
            assertThat(second.getHackerrank().getSolvedCount()).isEqualTo(15);
            assertThat(second.getGfg().getSolvedCount()).isEqualTo(15);

            // 3rd request: served from the cache, no upstream calls (verify fails on extras)
            CodingStatsResponse third = service.getCodingStats();
            assertThat(third.getLeetcode().getSolvedCount()).isEqualTo(321);
            upstream.verify();
        }

        @Test
        void oneFailedPlatformIsEnoughToSkipTheCache() {
            upstream.expect(requestTo(LEETCODE)).andRespond(okJson(leetcodeBody()));
            upstream.expect(requestTo(HACKERRANK)).andRespond(okJson(hackerrankBody()));
            upstream.expect(requestTo(GFG)).andRespond(withServerError());
            expectAllSucceed();

            CodingStatsResponse partial = service.getCodingStats();
            assertThat(partial.isIncomplete()).isTrue();
            assertThat(partial.getLeetcode().getSolvedCount()).isEqualTo(321); // others still shown
            assertThat(partial.getGfg().getSolvedCount()).isNull();

            assertThat(service.getCodingStats().isIncomplete()).isFalse();
            upstream.verify();
        }

        @Test
        void failureFlagIsNotPartOfTheJsonResponse() {
            upstream.expect(requestTo(LEETCODE)).andRespond(withServerError());
            upstream.expect(requestTo(HACKERRANK)).andRespond(okJson(hackerrankBody()));
            upstream.expect(requestTo(GFG)).andRespond(okJson(gfgBody()));

            String json = JsonMapper.builder().build().writeValueAsString(service.getCodingStats());

            assertThat(json)
                    .doesNotContain("failed")
                    .doesNotContain("incomplete")
                    .contains("\"solvedCount\":null")
                    .contains("\"profileUrl\"");
        }

        private void expectAllSucceed() {
            upstream.expect(requestTo(LEETCODE)).andRespond(okJson(leetcodeBody()));
            upstream.expect(requestTo(HACKERRANK)).andRespond(okJson(hackerrankBody()));
            upstream.expect(requestTo(GFG)).andRespond(okJson(gfgBody()));
        }

        private static org.springframework.test.web.client.ResponseCreator okJson(String body) {
            return withSuccess(body, MediaType.APPLICATION_JSON);
        }

        private static String leetcodeBody() {
            return """
                    {"data":{"matchedUser":{"submitStats":{"acSubmissionNum":[
                      {"difficulty":"All","count":321,"submissions":400},
                      {"difficulty":"Easy","count":150,"submissions":180}]}}}}""";
        }

        private static String hackerrankBody() {
            return "{\"models\":[{\"solved\":10},{\"solved\":\"5\"}]}";
        }

        private static String gfgBody() {
            return "{\"School\":1,\"Basic\":2,\"Easy\":3,\"Medium\":4,\"Hard\":5}";
        }
    }
}
